# Production checklist

## 1. Backend
- Create the `payments` table and apply the bundled SQL migrations.
- Enable Row Level Security on every table.
- Add policies so authenticated users can only read and write their own organization data.
- Move receipt images to Supabase Storage instead of storing base64 strings in rows.

## 2. Email reminders
- Add SendGrid secrets to Supabase Edge Functions.
- Deploy `send-rent-reminders` and `process-reminder-queue`.
- Schedule `process-reminder-queue` hourly or daily.

## 3. AI safety
- Treat AI receipt checks as advisory only.
- Keep a manual review queue for low-confidence results.
- Log extracted fields and anomalies for auditability.

## 4. Frontend
- Point `.env.local` to your real Supabase project.
- Test auth flows, demo mode, and reminder scheduling.
- Review bundle size and lazy-loaded routes after future UI growth.

## 5. Data model
- Consider splitting tenants, properties, leases, reminders, maintenance, and audit events into dedicated tables.
- Add foreign keys and immutable audit logs before production launch.
