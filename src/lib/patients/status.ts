import { z } from "zod";

export const PatientStatusEnum = z.enum(["potential", "confirmed"]);
export const PATIENT_STATUS = PatientStatusEnum.enum;
export type PatientStatus = z.infer<typeof PatientStatusEnum>;

export const PatientSourceEnum = z.enum(["organic", "staff", "imported"]);
export const PATIENT_SOURCE = PatientSourceEnum.enum;
export type PatientSource = z.infer<typeof PatientSourceEnum>;

export const PatientCreationChannelEnum = z.enum([
  "portal_signup",
  "admin_console",
  "operations_dashboard",
  "api",
  "import",
  "unknown",
]);
export const PATIENT_CREATION_CHANNEL = PatientCreationChannelEnum.enum;
export type PatientCreationChannel = z.infer<typeof PatientCreationChannelEnum>;
