import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.REMINDER_FROM_EMAIL;
const fromName = process.env.REMINDER_FROM_NAME || 'Vaultline Payments';

if (!apiKey || !fromEmail) {
  console.error('Missing SENDGRID_API_KEY or REMINDER_FROM_EMAIL');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

const reminders = [
  {
    to: process.env.TEST_TENANT_EMAIL || 'tenant@example.com',
    tenantName: 'Demo Tenant',
    unit: 'A-12',
    amount: 1200,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  },
];

const messages = reminders.map((item) => ({
  to: item.to,
  from: { email: fromEmail, name: fromName },
  subject: `Rent reminder for Unit ${item.unit}`,
  text: `Hello ${item.tenantName}, your rent payment of ${item.amount} is due on ${item.dueDate} for Unit ${item.unit}.`,
  html: `<p>Hello ${item.tenantName},</p><p>Your rent payment of <strong>${item.amount}</strong> is due on <strong>${item.dueDate}</strong> for Unit <strong>${item.unit}</strong>.</p>`,
}));

try {
  const [response] = await sgMail.send(messages);
  console.log('SendGrid accepted the reminders.', response.statusCode);
} catch (error) {
  console.error('Failed to send reminders');
  console.error(error?.response?.body || error);
  process.exit(1);
}
