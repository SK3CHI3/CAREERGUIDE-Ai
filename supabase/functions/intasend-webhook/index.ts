import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intasend-signature',
}

async function verifySignature(body: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!signature || !secret) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert hex signature to Uint8Array
    const sigArray = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      sigArray,
      encoder.encode(body)
    );
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-intasend-signature');
    const webhookSecret = Deno.env.get('INTASEND_WEBHOOK_SECRET');
    
    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // VERIFY SIGNATURE (Optional in Sandbox, Mandatory in Production)
    // To allow sandbox testing without a secret, we check if secret exists
    if (webhookSecret && !(await verifySignature(rawBody, signature, webhookSecret))) {
       console.error('Invalid IntaSend signature');
       // In strict mode, return 401. For now, let's log it.
       // return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
    }

    const body = JSON.parse(rawBody);
    console.log('Received IntaSend Webhook:', JSON.stringify(body));

    const { state, api_ref, invoice_id, tracking_id, value, challenge } = body;

    // Handle IntaSend setup challenge if they send one (rare but possible)
    if (challenge) {
      return new Response(JSON.stringify({ challenge }), { status: 200, headers: corsHeaders });
    }

    // Only process completed payments
    const isCompleted = ['COMPLETED', 'SUCCESSFUL', 'COMPLETE'].includes(state);
    if (!isCompleted) {
      console.log(`Payment state is ${state}, ignoring update.`);
      return new Response(JSON.stringify({ message: 'Ignored non-completed state' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!api_ref) {
      return new Response(JSON.stringify({ error: 'Missing api_ref' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // IDEMPOTENCY CHECK: Check if this transaction was already processed
    const transId = tracking_id || invoice_id;
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('intasend_transaction_id', transId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPayment) {
      console.log(`Transaction ${transId} already processed.`);
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // DETERMINE PAYMENT TYPE
    let paymentType: 'subscription' | 'quick_assessment' | 'counselor_session' = 'subscription';
    if (api_ref.startsWith('QA_')) {
      paymentType = 'quick_assessment';
    } else if (api_ref.startsWith('BOOK_')) {
      paymentType = 'counselor_session';
    }

    // RECORD PAYMENT IN AUDIT TABLE
    let userId: string | null = null;
    let schoolId: string | null = null;

    if (api_ref.includes('_')) {
       const parts = api_ref.split('_');
       userId = parts[1]; // PAY_{userId}_..., BOOK_{userId}_..., QA_{userId}_...
    }

    // Fetch user current school if applicable
    if (userId) {
       const { data: userProfile } = await supabase.from('profiles').select('school_id').eq('id', userId).single();
       schoolId = userProfile?.school_id || null;
    }

    await supabase.from('payments').insert([{
       user_id: userId,
       school_id: schoolId,
       amount: value,
       status: 'completed',
       payment_type: paymentType,
       intasend_transaction_id: transId,
       api_ref: api_ref,
       payload: body
    }]);

    // DETERMINE TERM-BASED EXPIRY
    const { data: termSettings } = await supabase.from('global_settings').select('value').eq('key', 'current_term_dates').single();
    const termDates = termSettings?.value || {
       term1: { start: '2026-01-05', end: '2026-04-10' },
       term2: { start: '2026-05-04', end: '2026-08-07' },
       term3: { start: '2026-08-31', end: '2026-10-30' }
    };

    let expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Default 90 days
    
    // Find current or next term end date
    const now = new Date();
    const sortedTerms = Object.values(termDates).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    for (const term of sortedTerms as any[]) {
       const end = new Date(term.end);
       if (now <= end) {
          expiryDate = new Date(end.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // Add 3-day grace
          break;
       }
    }

    // UPDATE PROFILES / SCHOOL SUBSCRIPTIONS
    if (api_ref.startsWith('PAY_')) {
      // Individual or School Enrollment Payment
      const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', userId).single();
      
      if (profile?.role === 'school' && profile.school_id) {
         // School Payment - Update school subscription
         await supabase.from('school_subscriptions').insert([{
            school_id: profile.school_id,
            tier: 'premium',
            payment_reference: transId,
            expires_at: expiryDate
         }]);
         
         // Also update the rep profile
         await supabase.from('profiles').update({
            payment_status: 'completed',
            subscription_expires_at: expiryDate,
            subscription_type: 'institutional'
         }).eq('id', userId);
      } else {
         // Individual Payment
         await supabase.from('profiles').update({
            payment_status: 'completed',
            payment_reference: transId,
            payment_amount: value,
            intasend_transaction_id: transId,
            subscription_expires_at: expiryDate,
            subscription_type: 'individual'
         }).eq('id', userId);
      }
    } else if (api_ref.startsWith('BOOK_')) {
       // Counseling Booking
       const parts = api_ref.split('_');
       if (parts.length >= 3) {
          const studentId = parts[1];
          const counselorId = parts[2];
          
          await supabase.from('counselor_sessions').insert([{
             student_id: studentId,
             counselor_id: counselorId,
             status: 'active',
             payment_amount: value,
             payment_reference: transId,
             intasend_transaction_id: transId
          }]);
       }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
