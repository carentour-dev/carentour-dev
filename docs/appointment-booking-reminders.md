# Appointment Booking Reminders

Version: 1.0

Last reviewed against code: May 30, 2026

## Who this is for

Operators and developers deploying or troubleshooting appointment reminder emails for the admin Booking Queue.

## What this system does

Appointment reminders are sent from the Supabase Edge Function `send-appointment-reminders`.

The admin app can preview or manually send a reminder from `/admin/appointment-bookings`. Supabase Cron can also call the same Edge Function every 15 minutes to send automatic reminders for confirmed future bookings.

Reminder results are stored on `appointment_bookings.metadata` and shown in the Booking Queue row, details modal, reminder audit, and activity timeline.

## Runtime pieces

- Admin UI: `/admin/appointment-bookings`
- Server action/API layer: `src/server/modules/appointmentBookings/module.ts`
- Edge Function: `supabase/functions/send-appointment-reminders/index.ts`
- Supabase config: `supabase/config.toml`
- Scheduler: Supabase SQL Editor using `pg_cron` and `pg_net`
- Email provider: Resend

## Required configuration

Supabase Edge Function secrets:

- `RESEND_API_KEY`: Resend API key used to send reminder emails.
- `REMINDER_JOB_SECRET`: shared secret used by Cron and the admin app when calling the reminder function.
- `REMINDER_NOTIFICATION_FROM`: optional reminder sender, for example `Care N Tour <contact@carentour.com>`.
- `BOOKING_NOTIFICATION_FROM`: fallback sender if `REMINDER_NOTIFICATION_FROM` is not set.
- `SUPABASE_URL`: default Supabase function secret.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key, or the platform-provided default secret key.

Vercel environment variables:

- `REMINDER_JOB_SECRET`: must exactly match the Supabase `REMINDER_JOB_SECRET` and the Cron `x-reminder-secret` value.

Do not expose `REMINDER_JOB_SECRET`, `RESEND_API_KEY`, or service role keys with a `NEXT_PUBLIC_` prefix.

## Edge Function deployment

Deploy the `send-appointment-reminders` Edge Function after changing its code or secrets.

The function should be deployed with Supabase platform JWT verification disabled:

```toml
[functions.send-appointment-reminders]
verify_jwt = false
```

This is intentional. Supabase Cron calls the function with `x-reminder-secret`, and the function validates that secret internally. If platform JWT verification is left enabled, Cron can receive `401 UNAUTHORIZED_NO_AUTH_HEADER` before the function code runs.

## Cron setup

Use Supabase SQL Editor. Replace `<project-ref>` and `<same REMINDER_JOB_SECRET>` before running.

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('send-appointment-reminders-every-15-minutes');

select cron.schedule(
  'send-appointment-reminders-every-15-minutes',
  '*/15 * * * *',
  $$
  select
    net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/send-appointment-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-reminder-secret', '<same REMINDER_JOB_SECRET>'
      ),
      body := '{"dryRun": false}'::jsonb
    );
  $$
);
```

Only run `cron.unschedule` when replacing an existing job with the same name.

## Manual smoke test

Use this from Supabase SQL Editor to test the Edge Function without sending email:

```sql
select
  net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reminder-secret', '<same REMINDER_JOB_SECRET>'
    ),
    body := '{"dryRun": true}'::jsonb
  );
```

Then inspect the response:

```sql
select
  id,
  status_code,
  error_msg,
  content,
  created
from net._http_response
order by created desc
limit 10;
```

A healthy dry run returns `status_code = 200` and JSON with `"success": true`. It can still show `"checked": 0` and `"processed": 0` when there are no eligible confirmed bookings in the reminder window.

## Verify the scheduled job

Check that the job exists and is active:

```sql
select
  jobid,
  jobname,
  schedule,
  active
from cron.job
where jobname = 'send-appointment-reminders-every-15-minutes';
```

Check recent runs:

```sql
select
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
from cron.job_run_details
where jobid = <jobid>
order by start_time desc
limit 10;
```

Check recent HTTP responses:

```sql
select
  id,
  status_code,
  error_msg,
  content,
  created
from net._http_response
order by created desc
limit 10;
```

The Cron job runs every 15 minutes. After changing Cron SQL, wait for the next 00, 15, 30, or 45 minute mark, then rerun the response query.

## Admin UI smoke test

1. Open `/admin/appointment-bookings`.
2. Confirm there is an active confirmed future booking with a patient or request email.
3. Open **Actions** and choose **Preview reminder**.
4. Confirm the preview uses the real booking time, doctor, type, and only relevant delivery details.
5. Choose **Send reminder now** or **Retry reminder**.
6. Confirm the row changes from `Reminder pending` to a last reminder summary.
7. Open **View details** and confirm **Reminder audit** and **Activity timeline** were updated.
8. Check Resend logs for the delivered email.

## Common failures

`401 UNAUTHORIZED_NO_AUTH_HEADER` in `net._http_response`:

Supabase platform JWT verification is still enabled for the Edge Function, or the request is missing platform authorization. Preferred fix: deploy with `[functions.send-appointment-reminders] verify_jwt = false` and keep using `x-reminder-secret`.

`401 Unauthorized` from the function:

The request reached the function, but `x-reminder-secret` does not match `REMINDER_JOB_SECRET`.

`RESEND_API_KEY is not configured`:

The Supabase Edge Function secret is missing or the function was not redeployed after adding it.

`Appointment reminder function failed` in the admin app:

Check Supabase Edge Function logs first, then inspect `net._http_response`. The admin app calls the same function and needs `REMINDER_JOB_SECRET` configured in Vercel.

`checked: 0` and `processed: 0`:

The job ran successfully, but no confirmed active booking matched the automatic reminder window. This is normal when appointments are not within 24 hours, already received that reminder, are archived, cancelled, or missing `confirmed_starts_at`.

Success toast but email not received:

Check the booking detail reminder audit, then check Resend logs. Also verify the sender address domain is verified in Resend and the patient email is correct.

Reminder audit does not update:

Only non-dry-run sends update `appointment_bookings.metadata`. If the Edge Function code changed, redeploy it before testing again.

## Rotation checklist

When rotating `REMINDER_JOB_SECRET`, update all three places during the same maintenance window:

1. Supabase Edge Function secret `REMINDER_JOB_SECRET`.
2. Vercel environment variable `REMINDER_JOB_SECRET`, followed by redeploying the app.
3. Supabase Cron SQL header `x-reminder-secret`, followed by checking `cron.job` and `net._http_response`.
