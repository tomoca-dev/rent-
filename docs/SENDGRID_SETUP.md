# SendGrid setup

This project now includes a ready-to-wire reminder email integration using SendGrid.

## What is included

- `supabase/functions/send-rent-reminders/index.ts`
  - Sends one or more reminder emails through the SendGrid REST API.
- `supabase/functions/process-reminder-queue/index.ts`
  - Example scheduled function that reads due reminders from Supabase and dispatches them.
- `scripts/send-reminders.mjs`
  - Simple Node script for local testing with `@sendgrid/mail`.
- `supabase/migrations/20260310_reminders.sql`
  - Queue table for reminder records.

## Required environment variables

For the frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY` (optional)

For email sending:

- `SENDGRID_API_KEY`
- `REMINDER_FROM_EMAIL`
- `REMINDER_FROM_NAME` (optional)
- `APP_BASE_URL` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (for scheduled server-side queue processing)

## SendGrid steps

1. Create a SendGrid account.
2. Verify a sender identity.
3. Create an API key with Mail Send access.
4. Add the key to your Supabase function secrets or local `.env`.

## Local test

```bash
npm install
npm run send:test-reminders
```

## Recommended production flow

1. App creates reminder rows in `public.reminder_queue`.
2. A scheduled Supabase Edge Function runs every hour.
3. The function selects queued reminders due for delivery.
4. It sends email through SendGrid.
5. It updates `status` to `SENT` or `FAILED`.

## Important

Do **not** put the SendGrid API key in the React frontend.
Use only server-side functions or scripts.
