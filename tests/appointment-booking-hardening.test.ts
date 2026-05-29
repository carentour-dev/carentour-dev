import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("patient appointment writes check conflicts before persisting", () => {
  const source = readSource("src/server/modules/patientAppointments/module.ts");

  assert.match(source, /const ACTIVE_STATUS_VALUES = \[/);
  assert.match(source, /const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;/);
  assert.match(source, /async create\(payload: unknown\) \{/);
  assert.match(source, /await ensureNoAppointmentConflict\(\{/);
  assert.match(source, /async update\(id: unknown, payload: unknown\) \{/);
  assert.match(source, /excludeAppointmentId: appointmentId/);
  assert.match(source, /throw mapAppointmentWriteError\(error\);/);
});

test("appointment conflict migration protects new active writes", () => {
  const source = readSource(
    "supabase/migrations/20260529182047_harden_appointment_booking.sql",
  );

  assert.match(
    source,
    /CREATE OR REPLACE FUNCTION public\.prevent_patient_appointment_conflicts/,
  );
  assert.match(
    source,
    /NEW\.status NOT IN \('scheduled', 'confirmed', 'rescheduled'\)/,
  );
  assert.match(
    source,
    /COALESCE\(NEW\.ends_at, NEW\.starts_at \+ interval '30 minutes'\)/,
  );
  assert.match(source, /existing\.patient_id = NEW\.patient_id/);
  assert.match(source, /existing\.doctor_id = NEW\.doctor_id/);
  assert.match(source, /existing\.facility_id = NEW\.facility_id/);
  assert.match(source, /USING ERRCODE = '23P01'/);
});

test("public consultation flow distinguishes requested and confirmed slots", () => {
  const pageSource = readSource(
    "src/app/(public)/[locale]/consultation/ConsultationPageClient.tsx",
  );
  const routeSource = readSource("src/app/api/consultations/route.ts");

  assert.match(pageSource, /<FormLabel>Preferred Time<\/FormLabel>/);
  assert.match(pageSource, /Guest requests use this as a preferred time/);
  assert.match(
    pageSource,
    /Authenticated patients can book a listed time directly/,
  );
  assert.match(pageSource, /Preferred time requested/);
  assert.match(routeSource, /notificationQueued: !emailError/);
  assert.doesNotMatch(routeSource, /if \(emailError\) \{\s*throw emailError;/);
});

test("consultation submissions carry an idempotency key through the request flow", () => {
  const pageSource = readSource(
    "src/app/(public)/[locale]/consultation/ConsultationPageClient.tsx",
  );
  const routeSource = readSource("src/app/api/consultations/route.ts");
  const contactRequestSource = readSource(
    "src/server/modules/contactRequests/module.ts",
  );
  const migrationSource = readSource(
    "supabase/migrations/20260529183853_add_consultation_submission_idempotency.sql",
  );

  assert.match(pageSource, /const createSubmissionKey = \(\) => \{/);
  assert.match(
    pageSource,
    /const submissionKeyRef = useRef\(createSubmissionKey\(\)\);/,
  );
  assert.match(pageSource, /idempotencyKey: submissionKeyRef\.current/);
  assert.match(
    pageSource,
    /submissionKeyRef\.current = createSubmissionKey\(\);/,
  );

  assert.match(
    routeSource,
    /idempotencyKey: z\.string\(\)\.min\(12\)\.max\(120\)\.optional\(\)/,
  );
  assert.match(
    routeSource,
    /const existingSubmission = await findExistingSubmission/,
  );
  assert.match(routeSource, /duplicate: true/);
  assert.match(routeSource, /idempotency_key: idempotencyKey \?\? undefined/);

  assert.match(
    contactRequestSource,
    /idempotency_key: z\.string\(\)\.min\(12\)\.max\(120\)\.optional\(\)/,
  );
  assert.match(
    contactRequestSource,
    /idempotency_key: trimOptional\(parsed\.idempotency_key\)/,
  );

  assert.match(
    migrationSource,
    /ADD COLUMN IF NOT EXISTS idempotency_key text/,
  );
  assert.match(
    migrationSource,
    /CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_requests_idempotency_key_unique/,
  );
});
