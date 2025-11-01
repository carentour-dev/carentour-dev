/*
 * Start Journey wizard refactor:
 * - Uses React Hook Form for validation per step
 * - Pulls treatments/procedures dynamically
 * - Supports range-based travel date selection
 * - Integrates document uploads with Supabase storage metadata
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  FileText,
  Loader2,
  Plane,
  Upload,
  User,
  Video,
  Phone,
  Stethoscope,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTreatments } from "@/hooks/useTreatments";
import type { NormalizedTreatment } from "@/lib/treatments";
import { COUNTRY_OPTIONS } from "@/constants/countries";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const steps = [
  { id: 1, title: "Basic Information", icon: User },
  { id: 2, title: "Medical History", icon: Stethoscope },
  { id: 3, title: "Travel Preferences", icon: Plane },
  { id: 4, title: "Documents", icon: FileText },
  { id: 5, title: "Schedule Consultation", icon: CalendarIcon },
] as const;

type StepId = (typeof steps)[number]["id"];

const getNextStepId = (current: StepId): StepId => {
  const currentIndex = steps.findIndex((step) => step.id === current);
  const nextStep = steps[currentIndex + 1];
  return nextStep ? nextStep.id : current;
};

const getPreviousStepId = (current: StepId): StepId => {
  const currentIndex = steps.findIndex((step) => step.id === current);
  const previousStep = steps[currentIndex - 1];
  return previousStep ? previousStep.id : current;
};

const documentTypeSchema = z.enum([
  "passport",
  "medical_records",
  "insurance",
  "other",
]);
type DocumentUploadType = z.infer<typeof documentTypeSchema>;

const uploadedDocumentSchema = z.object({
  id: z.string(),
  type: documentTypeSchema,
  originalName: z.string(),
  storedName: z.string(),
  path: z.string(),
  bucket: z.string(),
  size: z.number().nonnegative(),
  url: z.string().nullable(),
  uploadedAt: z.string(),
});

const travelDatesSchema = z
  .object({
    from: z.date({ required_error: "Select your preferred departure date" }),
    to: z.date().nullable(),
  })
  .refine(
    (value) => {
      if (!value.to || !value.from) {
        return true;
      }
      return value.to >= value.from;
    },
    {
      path: ["to"],
      message: "Return date must be after your departure",
    },
  );

const startJourneyFormSchema = z.object({
  // Step 1
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Share a contact number or WhatsApp"),
  age: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : ""))
    .refine(
      (value) =>
        value.length === 0 || /^[1-9][0-9]?$|^1[0-1][0-9]$|^120$/.test(value),
      "Enter a valid age",
    )
    .optional(),
  country: z.string().min(1, "Select your country of residence"),
  treatmentId: z.string().min(1, "Choose a treatment"),
  procedureId: z.string().optional(),
  timeline: z.string().optional(),
  budgetRange: z.string().optional(),

  // Step 2
  medicalCondition: z
    .string()
    .min(20, "Describe your medical condition (20 characters minimum)"),
  previousTreatments: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  doctorPreference: z.string().optional(),
  accessibilityNeeds: z.string().optional(),

  // Step 3
  travelDates: travelDatesSchema,
  accommodationType: z.string().optional(),
  companionTravelers: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  languagePreference: z.string().optional(),
  languageNotes: z.string().optional(),

  // Step 4
  hasInsurance: z.boolean().default(false),
  hasPassport: z.boolean().default(false),
  hasMedicalRecords: z.boolean().default(false),
  documents: z.array(uploadedDocumentSchema),

  // Step 5
  consultationMode: z.enum(["video", "phone"]).optional(),
});

type StartJourneyFormValues = z.infer<typeof startJourneyFormSchema>;
type UploadedDocument = StartJourneyFormValues["documents"][number];

type UploadState = Record<DocumentUploadType, boolean>;

type DocumentDefinition = {
  type: DocumentUploadType;
  label: string;
  description: string;
  multiple: boolean;
  checkboxField: "hasPassport" | "hasMedicalRecords" | "hasInsurance" | null;
};

const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    type: "passport",
    label: "Passport copy",
    description: "Required for visa coordination and hospital admissions",
    multiple: false,
    checkboxField: "hasPassport",
  },
  {
    type: "medical_records",
    label: "Medical records",
    description: "Upload imaging, lab results, or physician letters",
    multiple: true,
    checkboxField: "hasMedicalRecords",
  },
  {
    type: "insurance",
    label: "Insurance documents",
    description: "Optional — helps our coordinators review coverage",
    multiple: false,
    checkboxField: "hasInsurance",
  },
];

type StepPanelProps = {
  step: StepId;
  currentStep: StepId;
  className?: string;
  children: ReactNode;
};

const StepPanel = ({
  step,
  currentStep,
  className,
  children,
}: StepPanelProps) => (
  <section
    data-step={step}
    aria-hidden={currentStep !== step}
    className={cn(currentStep !== step && "hidden", className)}
  >
    {children}
  </section>
);

const extractErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if (
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message?: string }).message
  ) {
    return (error as { message: string }).message;
  }

  for (const value of Object.values(error as Record<string, unknown>)) {
    const nested = extractErrorMessage(value);
    if (nested) {
      return nested;
    }
  }

  return undefined;
};

const findFirstError = (
  errors: FieldErrors<StartJourneyFormValues>,
): { field: keyof StartJourneyFormValues | null; message: string | null } => {
  for (const key of Object.keys(errors) as Array<
    keyof StartJourneyFormValues
  >) {
    const errorValue = errors[key];
    if (!errorValue) continue;
    const message = extractErrorMessage(errorValue);
    return { field: key, message: message ?? null };
  }
  return { field: null, message: null };
};

const FIELD_STEP_LOOKUP: Partial<Record<keyof StartJourneyFormValues, StepId>> =
  {
    firstName: 1,
    lastName: 1,
    email: 1,
    phone: 1,
    age: 1,
    country: 1,
    treatmentId: 1,
    procedureId: 1,
    timeline: 1,
    budgetRange: 1,
    medicalCondition: 2,
    previousTreatments: 2,
    currentMedications: 2,
    allergies: 2,
    doctorPreference: 2,
    accessibilityNeeds: 2,
    travelDates: 3,
    accommodationType: 3,
    companionTravelers: 3,
    dietaryRequirements: 3,
    languagePreference: 3,
    languageNotes: 3,
    hasInsurance: 4,
    hasPassport: 4,
    hasMedicalRecords: 4,
    documents: 4,
    consultationMode: 5,
  };

const STEP_VALIDATION_MAP: Record<StepId, (keyof StartJourneyFormValues)[]> = {
  1: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "country",
    "treatmentId",
    "procedureId",
  ],
  2: ["medicalCondition"],
  3: ["travelDates"],
  4: [],
  5: [],
};

const budgetOptions = [
  { value: "under5k", label: "Under $5,000" },
  { value: "5k-10k", label: "$5,000 – $10,000" },
  { value: "10k-25k", label: "$10,000 – $25,000" },
  { value: "25k-50k", label: "$25,000 – $50,000" },
  { value: "50k+", label: "$50,000+" },
];

const treatmentTimelineOptions = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "Within 1-3 months" },
  { value: "3-6months", label: "Within 3-6 months" },
  { value: "6months+", label: "6+ months" },
];

const companionOptions = [
  { value: "0", label: "Traveling alone" },
  { value: "1", label: "One companion" },
  { value: "2", label: "Two companions" },
  { value: "3+", label: "Three or more companions" },
];

const accommodationOptions = [
  { value: "luxury", label: "Luxury hotel (5★)" },
  { value: "premium", label: "Premium hotel (4★)" },
  { value: "standard", label: "Standard hotel (3★)" },
  { value: "budget", label: "Budget accommodation" },
  { value: "medical", label: "Medical guest house" },
  { value: "apartment", label: "Serviced apartment" },
];

const interpreterOptions = [
  { value: "english", label: "English (no interpreter needed)" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "arabic", label: "Arabic" },
  { value: "chinese", label: "Chinese" },
  { value: "russian", label: "Russian" },
  { value: "other", label: "Other / please specify in notes" },
];

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  age: "",
  country: "",
  treatmentId: "",
  procedureId: "",
  timeline: "",
  budgetRange: "",
  medicalCondition: "",
  previousTreatments: "",
  currentMedications: "",
  allergies: "",
  doctorPreference: "",
  accessibilityNeeds: "",
  travelDates: { from: undefined, to: undefined } as {
    from: Date | undefined;
    to: Date | undefined | null;
  },
  accommodationType: "",
  companionTravelers: "",
  dietaryRequirements: "",
  languagePreference: "",
  languageNotes: "",
  hasInsurance: false,
  hasPassport: false,
  hasMedicalRecords: false,
  documents: [] as UploadedDocument[],
  consultationMode: undefined as "video" | "phone" | undefined,
};

const todaysDate = (() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
})();

const getProcedureOptions = (treatment?: NormalizedTreatment | null) => {
  if (!treatment?.procedures?.length) {
    return [];
  }
  return treatment.procedures.map((procedure) => ({
    id: procedure.id,
    name: procedure.name,
  }));
};

const bytesToReadableSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

type UploadResponse = {
  document: UploadedDocument;
};

const DOCUMENT_UPLOAD_ENDPOINT = "/api/start-journey/documents";

function PatientJourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { session } = useAuth();
  const { treatments, loading: treatmentsLoading } = useTreatments();

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [uploadState, setUploadState] = useState<UploadState>({
    passport: false,
    medical_records: false,
    insurance: false,
    other: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadInputRefs = useRef<
    Record<DocumentUploadType, HTMLInputElement | null>
  >({
    passport: null,
    medical_records: null,
    insurance: null,
    other: null,
  });

  const form = useForm<StartJourneyFormValues>({
    resolver: zodResolver(startJourneyFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const treatmentId = useWatch({ control: form.control, name: "treatmentId" });
  const documents = useWatch({ control: form.control, name: "documents" });
  const languagePreference = useWatch({
    control: form.control,
    name: "languagePreference",
  });
  const consultationMode = useWatch({
    control: form.control,
    name: "consultationMode",
  });

  const selectedTreatment = useMemo(
    () => treatments.find((treatment) => treatment.id === treatmentId) ?? null,
    [treatmentId, treatments],
  );
  const procedureOptions = useMemo(
    () => getProcedureOptions(selectedTreatment ?? undefined),
    [selectedTreatment],
  );

  useEffect(() => {
    if (!treatmentId || !procedureOptions.length) {
      form.setValue("procedureId", "");
      return;
    }

    const currentProcedureId = form.getValues("procedureId");
    const stillValid = procedureOptions.some(
      (procedure) => procedure.id === currentProcedureId,
    );
    if (!stillValid) {
      form.setValue("procedureId", "");
    }
  }, [procedureOptions, form, treatmentId]);

  useEffect(() => {
    const treatmentSlug = searchParams.get("treatment");
    if (!treatmentSlug || !treatments.length) return;
    const matched = treatments.find(
      (treatment) => treatment.slug === treatmentSlug,
    );
    if (!matched) return;
    form.setValue("treatmentId", matched.id);
  }, [form, searchParams, treatments]);

  useEffect(() => {
    if (languagePreference !== "other") {
      const currentNotes = form.getValues("languageNotes");
      if (currentNotes) {
        form.setValue("languageNotes", "", {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      form.clearErrors("languageNotes");
    }
  }, [form, languagePreference]);

  const setUploadFlag = useCallback(
    (type: DocumentUploadType, value: boolean) => {
      setUploadState((prev) => ({ ...prev, [type]: value }));
    },
    [],
  );

  const updateDocumentCheckbox = useCallback(
    (type: DocumentUploadType, docs?: UploadedDocument[]) => {
      const definition = DOCUMENT_DEFINITIONS.find(
        (item) => item.type === type,
      );
      if (!definition?.checkboxField) return;

      const sourceDocuments = docs ?? form.getValues("documents");
      const hasDocs = sourceDocuments.some(
        (document) => document.type === definition.type,
      );
      form.setValue(definition.checkboxField, hasDocs);
    },
    [form],
  );

  const uploadDocument = useCallback(
    async (file: File, type: DocumentUploadType): Promise<UploadedDocument> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", type);

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(DOCUMENT_UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        headers,
      });

      const result = (await response.json()) as UploadResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result?.error ?? "Document upload failed");
      }
      return result.document;
    },
    [session?.access_token],
  );

  const handleFileSelection = useCallback(
    async (fileList: FileList | null, definition: DocumentDefinition) => {
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      setUploadFlag(definition.type, true);

      try {
        const currentDocuments = form.getValues("documents");
        const filtered = definition.multiple
          ? currentDocuments
          : currentDocuments.filter(
              (document) => document.type !== definition.type,
            );
        const allDocuments: UploadedDocument[] = [...filtered];

        for (const file of files) {
          const uploaded = await uploadDocument(file, definition.type);
          allDocuments.push(uploaded);
        }

        form.setValue("documents", allDocuments, {
          shouldDirty: true,
          shouldTouch: true,
        });
        updateDocumentCheckbox(definition.type, allDocuments);

        toast({
          title: "Upload complete",
          description:
            files.length > 1
              ? `${files.length} documents uploaded successfully`
              : `${files[0]?.name ?? "Document"} uploaded successfully`,
        });
      } catch (error) {
        console.error("Document upload failed:", error);
        toast({
          title: "Upload failed",
          description:
            error instanceof Error
              ? error.message
              : "We could not upload this file. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadFlag(definition.type, false);
      }
    },
    [form, setUploadFlag, toast, updateDocumentCheckbox, uploadDocument],
  );

  const removeDocument = useCallback(
    async (document: UploadedDocument) => {
      const { path, bucket, id, type } = document;

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const response = await fetch(DOCUMENT_UPLOAD_ENDPOINT, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ path, bucket }),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result?.error ?? "Failed to delete document");
        }
      } catch (error) {
        console.error("Failed to delete document:", error);
        toast({
          title: "Unable to remove file",
          description: "The document was kept on file. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const updated = form
        .getValues("documents")
        .filter((item) => item.id !== id);
      form.setValue("documents", updated, {
        shouldDirty: true,
        shouldTouch: true,
      });
      updateDocumentCheckbox(type, updated);
      toast({
        title: "Document removed",
        description: "The file was deleted from your intake request.",
      });
    },
    [form, session?.access_token, toast, updateDocumentCheckbox],
  );

  const handleAdvance = useCallback(async () => {
    const fields = STEP_VALIDATION_MAP[currentStep] ?? [];

    if (fields.length > 0) {
      const shouldValidateProcedure =
        fields.includes("procedureId") &&
        (!procedureOptions.length ||
          (procedureOptions.length === 0 && fields.length === 1));

      const filteredFields = shouldValidateProcedure
        ? fields.filter((field) => field !== "procedureId")
        : fields;

      const valid = await form.trigger(filteredFields);
      if (!valid) {
        toast({
          title: "Missing information",
          description:
            "Please fill in the highlighted fields before continuing.",
          variant: "destructive",
        });
        return;
      }

      if (
        !shouldValidateProcedure &&
        fields.includes("procedureId") &&
        procedureOptions.length > 0
      ) {
        const isProcedureSelected = Boolean(form.getValues("procedureId"));
        if (!isProcedureSelected) {
          form.setError("procedureId", {
            type: "manual",
            message: "Select a procedure",
          });
          toast({
            title: "Select a procedure",
            description: "Pick one of the available procedures to continue.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setCurrentStep((prev) => getNextStepId(prev));
  }, [currentStep, form, procedureOptions.length, toast]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => getPreviousStepId(prev));
  }, []);

  const handleInvalidSubmit = useCallback(
    (errors: FieldErrors<StartJourneyFormValues>) => {
      const { field: firstField, message } = findFirstError(errors);
      if (firstField) {
        const targetStep = FIELD_STEP_LOOKUP[firstField];
        if (targetStep) {
          setCurrentStep(targetStep);
        }
      }
      toast({
        title: "Missing information",
        description:
          message ??
          "Please complete the highlighted fields before submitting.",
        variant: "destructive",
      });
    },
    [setCurrentStep, toast],
  );

  const onSubmit = useCallback(
    async (values: StartJourneyFormValues) => {
      setIsSubmitting(true);

      try {
        if (!values.consultationMode) {
          form.setError("consultationMode", {
            type: "manual",
            message: "Select a consultation format",
          });
          toast({
            title: "Choose a consultation format",
            description:
              "Pick video or phone so our team knows how to reach you.",
            variant: "destructive",
          });
          setCurrentStep(5);
          setIsSubmitting(false);
          return;
        }

        const { treatmentId: selectedTreatmentId, procedureId } = values;
        const treatmentName =
          treatments.find((treatment) => treatment.id === selectedTreatmentId)
            ?.name ?? "";

        const preparedTravelWindow = (() => {
          const from = values.travelDates?.from;
          const to = values.travelDates?.to;
          if (!from) {
            return null;
          }
          return {
            from: from.toISOString(),
            to: to ? to.toISOString() : null,
          };
        })();

        const normalizedLanguageNotes =
          values.languagePreference === "other"
            ? (values.languageNotes?.trim() ?? "")
            : "";

        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          age: values.age?.trim() ?? "",
          country: values.country,
          treatmentId: selectedTreatmentId,
          treatmentName,
          procedureId,
          timeline: values.timeline,
          budgetRange: values.budgetRange,
          medicalCondition: values.medicalCondition,
          previousTreatments: values.previousTreatments,
          currentMedications: values.currentMedications,
          allergies: values.allergies,
          doctorPreference: values.doctorPreference,
          accessibilityNeeds: values.accessibilityNeeds,
          travelDates: preparedTravelWindow,
          accommodationType: values.accommodationType,
          companionTravelers: values.companionTravelers,
          dietaryRequirements: values.dietaryRequirements,
          languagePreference: values.languagePreference,
          languageNotes: normalizedLanguageNotes,
          hasInsurance: values.hasInsurance,
          hasPassport: values.hasPassport,
          hasMedicalRecords: values.hasMedicalRecords,
          consultationMode: values.consultationMode ?? null,
          documents: values.documents,
        };

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch("/api/start-journey", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          if (result?.details) {
            console.error(
              "Start journey submission error details:",
              result.details,
            );
          }
          throw new Error(
            result?.details?.fieldErrors
              ? `${result.error ?? "Unable to submit your journey request"} — ${JSON.stringify(result.details.fieldErrors)}`
              : (result?.error ?? "Unable to submit your journey request"),
          );
        }

        toast({
          title: "Request received",
          description:
            "Our care coordinators will follow up shortly with a tailored treatment and travel plan.",
        });

        form.reset(defaultValues);
        setCurrentStep(1);

        if (result?.redirectTo) {
          router.push(result.redirectTo);
        }
      } catch (error) {
        console.error("Start journey submission failed:", error);
        toast({
          title: "Submission failed",
          description:
            error instanceof Error
              ? error.message
              : "We could not submit your intake. Please review the form and try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, router, session?.access_token, setCurrentStep, toast, treatments],
  );

  const progressPercentage = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep],
  );

  const renderTravelDateLabel = useCallback(() => {
    const { from, to } = form.getValues("travelDates") ?? {};
    if (!from) {
      return "Select travel window";
    }
    if (!to) {
      return `Departing ${format(from, "PPP")}`;
    }
    if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
      return format(from, "PPP");
    }
    return `${format(from, "PPP")} – ${format(to, "PPP")}`;
  }, [form]);

  const renderDocumentList = useCallback(
    (definition: DocumentDefinition) => {
      const docsForType = documents.filter(
        (document) => document.type === definition.type,
      );
      if (!docsForType.length) {
        return (
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet. Accepted formats: PDF, JPG, PNG (up to
            10MB).
          </p>
        );
      }

      return (
        <ul className="space-y-2">
          {docsForType.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="flex flex-1 items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {document.originalName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {bytesToReadableSize(document.size)} • stored as{" "}
                    {document.storedName}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void removeDocument(document)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      );
    },
    [documents, removeDocument],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-lg font-semibold">Start Your Medical Journey</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:max-w-5xl">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1]?.title}
            </h2>
            <span className="text-sm text-muted-foreground">
              {progressPercentage}% complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="grid gap-2 md:grid-cols-5">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : isCompleted
                        ? "border-muted-foreground/40 bg-muted/20 text-muted-foreground"
                        : "border-border text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden text-xs font-medium md:inline">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="py-6">
            <Form {...form}>
              <form
                className="space-y-8"
                onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
              >
                <StepPanel
                  step={1}
                  currentStep={currentStep}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jane"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="jane@example.com"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone or WhatsApp *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 202 555 0182"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              placeholder="35"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional — helps surgeons review candidacy.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select
                            onValueChange={(selected) => {
                              onChange(selected);
                              form.clearErrors("country");
                            }}
                            value={value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger {...fieldProps}>
                                <SelectValue placeholder="Choose your country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-64">
                              {COUNTRY_OPTIONS.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment timeline</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue placeholder="When would you like to travel?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {treatmentTimelineOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="treatmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment of interest *</FormLabel>
                          <Select
                            onValueChange={(selected) => {
                              field.onChange(selected);
                              form.clearErrors("treatmentId");
                            }}
                            value={field.value ?? undefined}
                            disabled={
                              treatmentsLoading || treatments.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue
                                  placeholder={
                                    treatmentsLoading
                                      ? "Loading treatments..."
                                      : treatments.length === 0
                                        ? "No treatments available"
                                        : "Select a treatment"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {treatments.map((treatment) => (
                                <SelectItem
                                  key={treatment.id}
                                  value={treatment.id}
                                >
                                  {treatment.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="procedureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Procedure details{" "}
                            {procedureOptions.length ? "*" : "(optional)"}
                          </FormLabel>
                          <Select
                            onValueChange={(selected) => {
                              field.onChange(selected);
                              form.clearErrors("procedureId");
                            }}
                            value={field.value ?? undefined}
                            disabled={procedureOptions.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue
                                  placeholder={
                                    treatmentId
                                      ? procedureOptions.length === 0
                                        ? "No procedures available"
                                        : "Select a procedure"
                                      : "Select a treatment first"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {procedureOptions.map((procedure) => (
                                <SelectItem
                                  key={procedure.id}
                                  value={procedure.id}
                                >
                                  {procedure.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            We use this to match you with the right surgical
                            teams and price guides.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget guidance</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder="Share an estimated budget (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {budgetOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepPanel>

                <StepPanel
                  step={2}
                  currentStep={currentStep}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="medicalCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your medical condition *</FormLabel>
                        <FormDescription>
                          Share symptoms, prior diagnoses, and goals for
                          treatment. More detail helps us match you with the
                          right specialists.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="Example: I have keratoconus diagnosed in 2018..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="previousTreatments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Previous treatments or surgeries
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="List surgeries, treatments, or therapies you've tried."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentMedications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current medications</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Include dosage and frequency if possible."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Share any allergies to medications, anesthesia, or materials."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctorPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred doctors or hospitals</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Mention any doctor, facility, or region you prefer."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accessibilityNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accessibility needs</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Tell us about mobility considerations, recovery support, or translation requirements."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepPanel>

                <StepPanel
                  step={3}
                  currentStep={currentStep}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="travelDates"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Preferred travel dates *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value?.from && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {renderTravelDateLabel()}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              defaultMonth={field.value?.from ?? todaysDate}
                              selected={field.value}
                              onSelect={(range) => field.onChange(range)}
                              numberOfMonths={2}
                              disabled={(date) => date < todaysDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Pick a start date and optional return date. Dates can
                          be adjusted with your coordinator later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="accommodationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accommodation preference</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue placeholder="Select accommodation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accommodationOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companionTravelers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Companion travelers</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue placeholder="How many companions?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companionOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="languagePreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interpreter preference</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder="Do you need language support?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {interpreterOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {languagePreference === "other" && (
                    <FormField
                      control={form.control}
                      name="languageNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interpreter details</FormLabel>
                          <FormDescription>
                            Share the language or dialect you prefer so
                            coordinators can match the right interpreter.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Example: Swahili interpreter, speaks Kenyan dialect."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="dietaryRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Share allergies, religious requirements, or recovery nutrition needs."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepPanel>

                <StepPanel
                  step={4}
                  currentStep={currentStep}
                  className="space-y-8"
                >
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-sm text-muted-foreground">
                    Upload secure copies of your travel or medical documents.
                    Files are stored privately and only visible to our care
                    coordination team.
                  </div>

                  <div className="grid gap-6">
                    {DOCUMENT_DEFINITIONS.map((definition) => (
                      <div
                        key={definition.type}
                        className="space-y-3 rounded-lg border border-border/70 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {definition.label}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {definition.description}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              uploadInputRefs.current[definition.type]?.click();
                            }}
                            disabled={uploadState[definition.type]}
                            className="flex items-center gap-2"
                          >
                            {uploadState[definition.type] ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>

                        <input
                          id={`document-${definition.type}`}
                          type="file"
                          multiple={definition.multiple}
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          ref={(node) => {
                            uploadInputRefs.current[definition.type] = node;
                          }}
                          onChange={(event) => {
                            const { files } = event.target;
                            void handleFileSelection(files, definition);
                            event.target.value = "";
                          }}
                        />

                        {renderDocumentList(definition)}

                        {definition.checkboxField && (
                          <FormField
                            control={form.control}
                            name={definition.checkboxField}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div>
                                  <FormLabel className="text-sm font-medium">
                                    I will provide this{" "}
                                    {definition.multiple
                                      ? "set of documents"
                                      : "document"}{" "}
                                    later if needed
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </StepPanel>

                <StepPanel
                  step={5}
                  currentStep={currentStep}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      Pick your consultation format
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A medical concierge will confirm availability right after
                      receiving your intake.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="consultationMode"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Button
                            type="button"
                            variant={
                              field.value === "video" ? "default" : "outline"
                            }
                            className="h-24 flex-col items-center justify-center gap-2"
                            onClick={() => {
                              field.onChange("video");
                              form.clearErrors("consultationMode");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Video className="h-5 w-5" />
                              <span className="font-semibold">
                                Video consultation
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              15-minute call with care coordinator and
                              translator if needed
                            </span>
                          </Button>

                          <Button
                            type="button"
                            variant={
                              field.value === "phone" ? "default" : "outline"
                            }
                            className="h-24 flex-col items-center justify-center gap-2"
                            onClick={() => {
                              field.onChange("phone");
                              form.clearErrors("consultationMode");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Phone className="h-5 w-5" />
                              <span className="font-semibold">
                                Phone consultation
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              We call your preferred number within two hours
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        What happens after submitting?
                      </CardTitle>
                      <CardDescription>
                        Our medical concierges coordinate surgeons, travel, and
                        recovery in one itinerary.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li>
                          • Specialists review your medical history and
                          eligibility
                        </li>
                        <li>
                          • Coordinators prepare treatment timelines and price
                          ranges
                        </li>
                        <li>
                          • Travel team drafts flights, recovery hotels, and
                          companion itineraries
                        </li>
                        <li>
                          • You receive a detailed plan with next steps in under
                          24 hours
                        </li>
                      </ul>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-primary" />
                          <span>Average response time: under 2 hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>No payment required to submit your intake</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StepPanel>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={() => void handleAdvance()}
                      className="ml-auto flex items-center gap-2 sm:w-auto"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto flex items-center gap-2 sm:w-auto"
                      disabled={isSubmitting || !consultationMode}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          Complete Registration
                          <Check className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StartJourneyPage() {
  return <PatientJourneyContent />;
}
