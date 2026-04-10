import { corsHeaders } from '../_shared/cors.ts';

interface ReminderPayload {
  to: string;
  tenantName: string;
  unit: string;
  amount: number;
  dueDate: string;
  propertyName?: string;
  paymentId?: string;
}

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('REMINDER_FROM_EMAIL') || '';
const FROM_NAME = Deno.env.get('REMINDER_FROM_NAME') || 'Vaultline Payments';
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || '';

function buildMessage(reminder: ReminderPayload) {
  const reviewUrl = reminder.paymentId && APP_BASE_URL
    ? `${APP_BASE_URL.replace(/\/$/, '')}/payments/${reminder.paymentId}`
    : '';

  return {
    to: [{ email: reminder.to }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Rent reminder for Unit ${reminder.unit}`,
    content: [
      {
        type: 'text/plain',
        value: `Hello ${reminder.tenantName}, your rent payment of ${reminder.amount} is due on ${reminder.dueDate} for Unit ${reminder.unit}${reminder.propertyName ? ` at ${reminder.propertyName}` : ''}.${reviewUrl ? ` Review: ${reviewUrl}` : ''}`,
      },
      {
        type: 'text/html',
        value: `<p>Hello ${reminder.tenantName},</p><p>Your rent payment of <strong>${reminder.amount}</strong> is due on <strong>${reminder.dueDate}</strong> for Unit <strong>${reminder.unit}</strong>${reminder.propertyName ? ` at <strong>${reminder.propertyName}</strong>` : ''}.</p>${reviewUrl ? `<p><a href="${reviewUrl}">Review payment details</a></p>` : ''}`,
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing SendGrid configuration.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const reminders: ReminderPayload[] = Array.isArray(body?.reminders) ? body.reminders : [];

    if (!reminders.length) {
      return new Response(JSON.stringify({ error: 'No reminders supplied.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: reminders.map((item) => ({ to: [{ email: item.to }] })),
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: 'Vaultline rent reminder',
        content: [
          {
            type: 'text/plain',
            value: 'Your rent payment is due soon. See the matching personalized email body in single-send mode if needed.',
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const text = await sendGridResponse.text();
      return new Response(JSON.stringify({ error: 'SendGrid rejected the batch request.', detail: text }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also return the individually built payloads for debugging / future extension.
    return new Response(JSON.stringify({ sent: reminders.length, preview: reminders.map(buildMessage) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
