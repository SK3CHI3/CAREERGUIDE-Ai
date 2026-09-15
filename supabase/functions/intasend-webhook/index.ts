import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Content-Type': 'application/json',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const completedStates = new Set(['COMPLETED', 'SUCCESSFUL', 'COMPLETE'])

const response = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: corsHeaders })

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
    if (!webhookSecret) {
      console.error('INTASEND_WEBHOOK_SECRET is not configured');
      return response(503, { error: 'Webhook verification is not configured' })
    }
    if (!(await verifySignature(rawBody, signature, webhookSecret))) {
       console.error('Rejected IntaSend webhook with an invalid signature');
       return response(401, { error: 'Invalid signature' })
    }

    const body = JSON.parse(rawBody);
    const { state, api_ref, invoice_id, tracking_id, value, challenge } = body;

    // Handle IntaSend setup challenge if they send one (rare but possible)
    if (challenge) {
      return response(200, { challenge })
    }

    // Only process completed payments
    const isCompleted = completedStates.has(state);
    if (!isCompleted) {
      console.log(`Payment state is ${state}, ignoring update.`);
      return response(200, { message: 'Ignored non-completed state' })
    }

    if (typeof api_ref !== 'string' || !api_ref) {
      return response(400, { error: 'Missing api_ref' })
    }

    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) return response(400, { error: 'Invalid payment amount' })
    const transId = typeof tracking_id === 'string' && tracking_id ? tracking_id : invoice_id
    if (typeof transId !== 'string' || !transId) return response(400, { error: 'Missing transaction id' })

    const reference = api_ref.split('_')
    const paymentPrefix = reference[0]
    const userId = reference[1]
    if (!['PAY', 'QA', 'BOOK'].includes(paymentPrefix) || !userId || !UUID.test(userId)) {
      return response(400, { error: 'Invalid payment reference' })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // IDEMPOTENCY CHECK: Check if this transaction was already processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('intasend_transaction_id', transId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPayment) {
      console.log(`Transaction ${transId} already processed.`);
      return response(200, { success: true, message: 'Already processed' })
    }

    // DETERMINE PAYMENT TYPE
    let paymentType: 'subscription' | 'quick_assessment' | 'counselor_session' = 'subscription';
    if (paymentPrefix === 'QA') {
      paymentType = 'quick_assessment';
    } else if (paymentPrefix === 'BOOK') {
      paymentType = 'counselor_session';
    }

    // RECORD PAYMENT IN AUDIT TABLE
    let schoolId: string | null = null;
    const { data: userProfile } = await supabase.from('profiles').select('id, school_id, role').eq('id', userId).maybeSingle();
    if (!userProfile) return response(400, { error: 'Unknown payment account' })
    schoolId = userProfile.school_id || null;

    // Payment amount must agree with the server's product price, never the browser's input.
    if (paymentPrefix === 'PAY' && amount !== 499) return response(400, { error: 'Unexpected subscription amount' })
    if (paymentPrefix === 'QA' && amount !== 50) return response(400, { error: 'Unexpected assessment amount' })
    if (paymentPrefix === 'BOOK') {
      const counselorId = reference[2]
      if (!counselorId || !UUID.test(counselorId)) return response(400, { error: 'Invalid counselor reference' })
      const { data: counselor } = await supabase.from('counselors').select('hourly_rate').eq('id', counselorId).maybeSingle()
      if (!counselor || Number(counselor.hourly_rate) !== amount) return response(400, { error: 'Unexpected counselor payment amount' })
    }

    const paymentUserId: string | null = userId;

    await supabase.from('payments').insert([{
       user_id: paymentUserId,
       school_id: schoolId,
       amount,
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
    if (paymentPrefix === 'PAY') {
      // Individual or School Enrollment Payment
      const profile = userProfile
      
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
            payment_amount: amount,
            intasend_transaction_id: transId,
            subscription_expires_at: expiryDate,
            subscription_type: 'individual'
         }).eq('id', userId);
      }
    } else if (paymentPrefix === 'BOOK') {
       // Counseling Booking
       const parts = api_ref.split('_');
       if (parts.length >= 3) {
          const studentId = parts[1];
          const counselorId = parts[2];
          
          await supabase.from('counselor_sessions').insert([{
             student_id: studentId,
             counselor_id: counselorId,
             status: 'active',
             payment_amount: amount,
             payment_reference: transId,
             intasend_transaction_id: transId
          }]);
       }
    }

    return response(200, { success: true })
  } catch (error) {
    console.error('Webhook error:', error);
    return response(400, { error: error instanceof Error ? error.message : 'Webhook processing failed' })
  }
});
