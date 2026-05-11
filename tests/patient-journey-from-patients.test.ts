import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const patientsPageSource = read("src/app/(internal)/admin/patients/page.tsx");
const patientDetailsPageSource = read(
  "src/app/(internal)/admin/patients/[id]/page.tsx",
);
const journeyModuleSource = read(
  "src/server/modules/patientJourneys/module.ts",
);

assert.match(
  patientsPageSource,
  /patientId:\s*patient\.id[\s\S]*coordinatorProfileId:\s*patient\.coordinator_id/,
  "patients list should start journeys directly from a patient id",
);

assert.match(
  patientDetailsPageSource,
  /patientId:\s*target\.id[\s\S]*coordinatorProfileId:\s*target\.coordinator_id/,
  "patient details should start journeys directly from a patient id",
);

assert.match(
  patientsPageSource,
  /patient\.active_journey_id[\s\S]*Open Journey[\s\S]*Start Journey/,
  "patients list should open an existing active journey instead of duplicating it",
);

assert.match(
  journeyModuleSource,
  /if \(!parsed\.sourceType \|\| !parsed\.sourceId\)[\s\S]*from\("patient_journeys"\)[\s\S]*createDefaultJourneySteps/,
  "patient journey start endpoint should support patient-only journey creation",
);

console.log("patient journey from patients tests passed");
