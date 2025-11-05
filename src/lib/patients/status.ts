import { z } from "zod";

export const PatientStatusEnum = z.enum(["potential", "confirmed"]);

export const PATIENT_STATUS = PatientStatusEnum.enum;

export type PatientStatus = z.infer<typeof PatientStatusEnum>;
