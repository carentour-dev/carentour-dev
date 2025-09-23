import { z } from "zod";

// Step 1: Basic Information Schema
export const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required").min(10, "Please enter a valid phone number"),
  age: z.string().min(1, "Age is required").refine((val) => {
    const num = parseInt(val);
    return num >= 18 && num <= 120;
  }, "Age must be between 18 and 120"),
  country: z.string().min(1, "Please select your country"),
  treatmentType: z.string().min(1, "Please select a treatment type"),
  timeline: z.string().min(1, "Please select your preferred timeline"),
  budgetRange: z.string().min(1, "Please select your budget range"),
});

// Step 2: Medical History Schema
export const medicalHistorySchema = z.object({
  medicalCondition: z.string().min(1, "Please describe your current medical condition").min(10, "Please provide more details about your condition"),
  allergies: z.string().min(1, "Please specify any allergies (write 'None' if no allergies)"),
  previousTreatments: z.string().optional(),
  currentMedications: z.string().optional(),
  doctorPreference: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
});

// Step 3: Travel Preferences Schema
export const travelPreferencesSchema = z.object({
  preferredDates: z.date({ required_error: "Please select your preferred travel dates" }),
  accommodationType: z.string().min(1, "Please select your accommodation preference"),
  companionTravelers: z.string().min(1, "Please specify number of companion travelers"),
  languagePreference: z.string().min(1, "Please select your language preference"),
  dietaryRequirements: z.string().optional(),
});

// Step 4: Documents Schema (without refine for merging)
export const documentsSchema = z.object({
  hasPassport: z.boolean(),
  hasMedicalRecords: z.boolean(),
  hasInsurance: z.boolean(),
});

// Documents validation schema with refine for standalone use
export const documentsValidationSchema = documentsSchema.refine(
  (data) => data.hasPassport || data.hasMedicalRecords || data.hasInsurance, 
  {
    message: "Please confirm you have at least one required document",
    path: ["documents"]
  }
);

// Step 6: Consultation Schema
export const consultationSchema = z.object({
  consultationType: z.string().min(1, "Please select a consultation type"),
  consultationDate: z.date({ required_error: "Please select a consultation date" }),
});

// Combined schema for final validation
export const fullPatientJourneySchema = basicInfoSchema
  .merge(medicalHistorySchema)
  .merge(travelPreferencesSchema)
  .merge(documentsSchema)
  .merge(consultationSchema)
  .refine((data) => data.hasPassport || data.hasMedicalRecords || data.hasInsurance, {
    message: "Please confirm you have at least one required document",
    path: ["documents"]
  });

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>;
export type TravelPreferencesFormData = z.infer<typeof travelPreferencesSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type ConsultationFormData = z.infer<typeof consultationSchema>;
export type FullPatientJourneyFormData = z.infer<typeof fullPatientJourneySchema>;