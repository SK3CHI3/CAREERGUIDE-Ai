import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const headers = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || 'https://careerguideai.co.ke',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const fail = () => new Response(JSON.stringify({ error: 'Invalid identifier or password.' }), { status: 400, headers })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers })

  try {
    const { identifier, password } = await req.json()
    const cleanIdentifier = typeof identifier === 'string' ? identifier.replace(/[\s-]/g, '') : ''
    if (!cleanIdentifier || typeof password !== 'string' || password.length < 8 || cleanIdentifier.includes('@')) return fail()

    // Prevent query filter injection and keep the lookup format intentionally narrow.
    const isUpi = /^[A-Za-z0-9]{4,12}$/.test(cleanIdentifier) && !cleanIdentifier.startsWith('07') && !cleanIdentifier.startsWith('+')
    const isPhone = /^\+?\d{9,15}$/.test(cleanIdentifier)
    if (!isUpi && !isPhone) return fail()

    const url = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    if (!url || !serviceKey || !anonKey) throw new Error('Authentication function is not configured')

    const admin = createClient(url, serviceKey)
    const column = isUpi ? 'upi_number' : 'phone'
    const lookup = isUpi ? cleanIdentifier.toUpperCase() : cleanIdentifier
    const { data: profile } = await admin.from('profiles').select('email').eq(column, lookup).maybeSingle()
    if (!profile?.email) return fail()

    const auth = createClient(url, anonKey)
    const { data, error } = await auth.auth.signInWithPassword({ email: profile.email, password })
    if (error || !data.session) return fail()

    return new Response(JSON.stringify({ session: data.session }), { status: 200, headers })
  } catch (error) {
    console.error('Identifier login failed:', error instanceof Error ? error.message : error)
    return fail()
  }
})
