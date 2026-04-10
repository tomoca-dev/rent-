import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('REMINDER_FROM_EMAIL') || '';
const FROM_NAME = Deno.env.get('REMINDER_FROM_NAME') || 'Vaultline Payments';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY || !FROM_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing required function secrets.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from('reminder_queue')
    .select('*')
    .lte('scheduled_for', nowIso)
    .eq('status', 'QUEUED')
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: Array<{ id: string; status: string; detail?: string }> = [];

  for (const reminder of reminders || []) {
    const payload = {
      personalizations: [{ to: [{ email: reminder.tenant_email }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `Rent reminder for Unit ${reminder.unit}`,
      content: [
        {
          type: 'text/plain',
          value: `Hello ${reminder.tenant_name}, your rent payment of ${reminder.amount} is due on ${reminder.due_date}.`,
        },
      ],
    };

    const sendResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (sendResp.ok) {
      await supabase
        .from('reminder_queue')
        .update({ status: 'SENT', sent_at: new Date().toISOString() })
        .eq('id', reminder.id);
      results.push({ id: reminder.id, status: 'SENT' });
    } else {
      const detail = await sendResp.text();
      await supabase
        .from('reminder_queue')
        .update({ status: 'FAILED', failure_reason: detail })
        .eq('id', reminder.id);
      results.push({ id: reminder.id, status: 'FAILED', detail });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
