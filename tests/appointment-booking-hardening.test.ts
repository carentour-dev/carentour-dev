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

test("appointment booking workflow records selected slot lifecycle", () => {
  const migrationSource = readSource(
    "supabase/migrations/20260529225015_appointment_booking_workflow.sql",
  );
  const bookingSource = readSource(
    "src/server/modules/appointmentBookings/module.ts",
  );
  const routeSource = readSource("src/app/api/consultations/route.ts");
  const portalSource = readSource("src/hooks/usePatientPortalData.ts");

  assert.match(
    migrationSource,
    /CREATE TYPE public\.appointment_booking_status/,
  );
  assert.match(
    migrationSource,
    /CREATE TABLE IF NOT EXISTS public\.appointment_bookings/,
  );
  assert.match(
    migrationSource,
    /CREATE POLICY "Patients can view their appointment bookings"/,
  );
  assert.match(
    migrationSource,
    /CREATE OR REPLACE FUNCTION public\.hold_appointment_booking_slot/,
  );
  assert.match(
    migrationSource,
    /CREATE OR REPLACE FUNCTION public\.confirm_appointment_booking/,
  );
  assert.match(
    migrationSource,
    /CREATE OR REPLACE FUNCTION public\.expire_stale_appointment_booking_holds/,
  );
  assert.match(
    migrationSource,
    /GRANT EXECUTE ON FUNCTION public\.confirm_appointment_booking/,
  );

  assert.match(bookingSource, /async createRequested\(payload: unknown\)/);
  assert.match(bookingSource, /async hold\(/);
  assert.match(bookingSource, /async confirm\(/);
  assert.match(bookingSource, /expire_stale_appointment_booking_holds/);

  assert.match(routeSource, /appointmentBookingController\.createRequested/);
  assert.match(routeSource, /appointmentBookingController\.confirm/);
  assert.match(routeSource, /appointmentBookingController\.hold/);
  assert.match(routeSource, /appointmentBookingStatus/);

  assert.match(portalSource, /type AppointmentBookingRow/);
  assert.match(portalSource, /\.from\("appointment_bookings"\)/);
  assert.match(
    portalSource,
    /appointmentBookings: snapshot\?\.appointmentBookings/,
  );
});

test("admin booking queue exposes coordinator actions", () => {
  const moduleSource = readSource(
    "src/server/modules/appointmentBookings/module.ts",
  );
  const reassignmentMigrationSource = readSource(
    "supabase/migrations/20260529235307_appointment_booking_slot_reassignment.sql",
  );
  const listRouteSource = readSource(
    "src/app/api/admin/appointment-bookings/route.ts",
  );
  const actionRouteSource = readSource(
    "src/app/api/admin/appointment-bookings/[id]/route.ts",
  );
  const pageSource = readSource(
    "src/app/(internal)/admin/appointment-bookings/page.tsx",
  );
  const operationsPageSource = readSource(
    "src/app/(internal)/operations/appointment-bookings/page.tsx",
  );

  assert.match(moduleSource, /async list\(filters/);
  assert.match(moduleSource, /async performAction/);
  assert.match(moduleSource, /case "confirm"/);
  assert.match(moduleSource, /case "release"/);
  assert.match(moduleSource, /case "cancel"/);
  assert.match(moduleSource, /case "request_reschedule"/);
  assert.match(moduleSource, /case "assign_slot"/);
  assert.match(moduleSource, /async assignSlot/);

  assert.match(
    reassignmentMigrationSource,
    /CREATE OR REPLACE FUNCTION public\.reassign_appointment_booking_slot/,
  );
  assert.match(reassignmentMigrationSource, /status = 'rescheduled'/);
  assert.match(reassignmentMigrationSource, /previousSlotId/);

  assert.match(listRouteSource, /appointmentBookingController\.list/);
  assert.match(
    actionRouteSource,
    /appointmentBookingController\.performAction/,
  );
  assert.match(pageSource, /title="Booking Queue"/);
  assert.match(pageSource, /retry: false/);
  assert.match(pageSource, /Booking queue could not be loaded/);
  assert.match(pageSource, /useState<StatusFilter>\("all"\)/);
  assert.match(pageSource, /Needs action shows requested, held/);
  assert.match(pageSource, /No bookings currently need coordinator action/);
  assert.match(pageSource, /Confirm booking/);
  assert.match(pageSource, /Release hold/);
  assert.match(pageSource, /Request reschedule/);
  assert.match(pageSource, /Cancel booking/);
  assert.match(pageSource, /DropdownMenu/);
  assert.match(pageSource, /Assign available slot/);
  assert.match(pageSource, /action: "assign_slot"/);
  assert.match(operationsPageSource, /admin\/appointment-bookings\/page/);
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
