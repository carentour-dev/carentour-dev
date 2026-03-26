"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Globe2,
  HeartPulse,
  MapPin,
  Stethoscope,
  Upload,
  FileText,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTreatments } from "@/hooks/useTreatments";
import { COUNTRY_OPTIONS } from "@/constants/countries";

const consultationDocumentSchema = z.object({
  id: z.string(),
  type: z.literal("medical_records"),
  originalName: z.string(),
  storedName: z.string(),
  path: z.string(),
  bucket: z.string(),
  size: z.number().nonnegative(),
  url: z.string().nullable(),
  uploadedAt: z.string(),
});

const consultationSchema = z.object({
  fullName: z.string().min(1, "Share your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(1, "Share a phone or WhatsApp number"),
  country: z.string().min(1, "Tell us where you live"),
  treatmentId: z.string().min(1, "Select a treatment"),
  procedure: z.string().min(1, "Select a procedure"),
  travelWindow: z.date({ required_error: "Select your ideal travel date" }),
  healthBackground: z
    .string()
    .min(20, "Describe your health goals or diagnosis (20 characters minimum)"),
  budgetRange: z.string().optional(),
  companions: z.string().optional(),
  medicalReports: z.string().optional(),
  contactPreference: z.string().optional(),
  additionalQuestions: z.string().optional(),
  documents: z.array(consultationDocumentSchema).optional(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;
type ConsultationDocument = z.infer<typeof consultationDocumentSchema>;

const TRAVEL_HINTS = [
  {
    icon: CalendarDays,
    title: "Flexible travel planning",
    description:
      "Tell us your ideal timeline so coordinators can hold surgery dates that match.",
  },
  {
    icon: HeartPulse,
    title: "Medical concierge support",
    description:
      "A licensed medical team reviews every request to match you with the right specialists.",
  },
  {
    icon: Users,
    title: "Travel companions welcome",
    description:
      "Share if family is traveling so we manage accommodation and recovery plans.",
  },
];

const DOCUMENT_UPLOAD_ENDPOINT = "/api/consultations/documents";
const ALLOWED_FILE_TYPES = "application/pdf,image/png,image/jpeg,image/jpg";

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Prospective", lastName: "Patient" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Patient" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export default function ConsultationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      country: "",
      treatmentId: "",
      procedure: "",
      travelWindow: undefined,
      healthBackground: "",
      budgetRange: "",
      companions: "",
      medicalReports: "",
      contactPreference: "",
      additionalQuestions: "",
      documents: [],
    },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { treatments: treatmentRows, loading: treatmentsLoading } =
    useTreatments();

  const treatments = useMemo(() => treatmentRows, [treatmentRows]);

  const selectedTreatmentId = form.watch("treatmentId");
  const documents = form.watch("documents") ?? [];

  const selectedTreatment = useMemo(
    () => treatments.find((treatment) => treatment.id === selectedTreatmentId),
    [selectedTreatmentId, treatments],
  );

  const procedureOptions = selectedTreatment?.procedures ?? [];

  useEffect(() => {
    if (selectedTreatmentId) {
      form.setValue("procedure", "");
      form.clearErrors("procedure");
    } else {
      form.setValue("procedure", "");
      form.clearErrors("procedure");
    }
  }, [selectedTreatmentId, form]);

  const uploadDocument = async (file: File): Promise<ConsultationDocument> => {
    setUploadingDocuments(true);
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(DOCUMENT_UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
      headers,
    });

    const result = (await response.json()) as {
      document?: ConsultationDocument;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result?.error ?? "Document upload failed");
    }

    if (!result.document) {
      throw new Error("Upload succeeded but document was not returned.");
    }

    return result.document;
  };

  const removeDocument = async (document: ConsultationDocument) => {
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
        body: JSON.stringify({
          path: document.path,
          bucket: document.bucket,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error ?? "Failed to delete document");
      }

      const remainingDocuments = (form.getValues("documents") ?? []).filter(
        (doc) => doc.path !== document.path,
      );
      form.setValue("documents", remainingDocuments, {
        shouldDirty: true,
        shouldTouch: true,
      });
      toast({
        title: "Attachment removed",
        description: `${document.originalName} was deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete consultation document", error);
      toast({
        title: "Unable to delete file",
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentSelection = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadingDocuments(true);
    try {
      const uploads: ConsultationDocument[] = [];
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadDocument(file);
        uploads.push(uploaded);
      }

      const existing = form.getValues("documents") ?? [];
      const all = [...existing, ...uploads];
      form.setValue("documents", all, {
        shouldDirty: true,
        shouldTouch: true,
      });
      toast({
        title: "Upload complete",
        description:
          uploads.length > 1
            ? `${uploads.length} files uploaded successfully`
            : `${uploads[0]?.originalName ?? "File"} uploaded successfully`,
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
      setUploadingDocuments(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!Number.isFinite(bytes ?? NaN) || (bytes ?? 0) <= 0) return "";
    const units = ["B", "KB", "MB"];
    const value = bytes as number;
    const index = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      units.length - 1,
    );
    const size = value / Math.pow(1024, index);
    const precision = size >= 10 || index === 0 ? 0 : 1;
    return `${size.toFixed(precision)} ${units[index]}`;
  };

  const handleSubmit = async (values: ConsultationFormValues) => {
    setIsSubmitting(true);

    try {
      const documentNames =
        values.documents
          ?.map((doc) => doc.originalName)
          .filter((name) => typeof name === "string" && name.length > 0) ?? [];
      const medicalReportsInput = values.medicalReports?.trim() ?? "";
      const medicalReports =
        medicalReportsInput ||
        (documentNames.length > 0 ? documentNames.join(", ") : "");

      const selectedTreatmentName =
        treatments.find((treatment) => treatment.id === values.treatmentId)
          ?.name ?? "";

      const combinedTreatment = [selectedTreatmentName, values.procedure]
        .filter((part) => part && part.length > 0)
        .join(" — ");

      const { treatmentId, procedure, travelWindow, ...rest } = values;

      const submissionPayload = {
        ...rest,
        documents: values.documents ?? [],
        medicalReports,
        treatmentId,
        procedure,
        treatment: combinedTreatment || selectedTreatmentName || procedure,
        travelWindow: travelWindow.toISOString(),
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers,
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Failed to submit consultation request",
        );
      }

      const { firstName, lastName } = splitFullName(values.fullName);
      console.log(
        "Consultation request stored for:",
        firstName,
        lastName,
        result.consultationRequestId,
      );

      toast({
        title: "Consultation Request Submitted",
        description:
          "Our coordinators will review your medical notes and reach out within two hours to plan your trip.",
      });

      form.reset();
      router.prefetch("/"); // prepare homepage follow-up in case they navigate back
    } catch (error) {
      console.error("Failed to submit consultation request", error);
      toast({
        title: "Something went wrong",
        description:
          "We could not process your request. Please try again or call our hotline.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-gradient-card py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl space-y-6">
              <Badge variant="outline">Free Medical Concierge</Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Plan Your Global Treatment With Our Medical Coordinators
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Share your medical goals, preferred treatment, and travel plans.
                Our Care N Tour team pairs you with accredited clinics, handles
                travel logistics, and follows up within hours.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {TRAVEL_HINTS.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="flex h-full flex-col gap-2 rounded-lg border border-border/50 bg-background/80 p-4 backdrop-blur"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
              <Card className="border-border/50 shadow-card-hover">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Free Consultation Request
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Provide as much detail as you can so our medical team can
                    respond with a tailored treatment and travel plan.
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      className="space-y-8"
                      onSubmit={form.handleSubmit(handleSubmit)}
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Ahmed" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                              <FormLabel>Primary Phone or WhatsApp *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+1 202 555 0182"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country of Residence *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="treatmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Treatment *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={
                                  treatmentsLoading || treatments.length === 0
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
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
                          name="procedure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Procedure *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.clearErrors("procedure");
                                }}
                                value={field.value}
                                disabled={
                                  !selectedTreatment ||
                                  procedureOptions.length === 0
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        selectedTreatment
                                          ? procedureOptions.length === 0
                                            ? "No procedures available"
                                            : "Select a procedure"
                                          : "Select a treatment first"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {procedureOptions.map((procedureOption) => (
                                    <SelectItem
                                      key={procedureOption.name}
                                      value={procedureOption.name}
                                    >
                                      {procedureOption.name}
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
                        name="travelWindow"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Ideal Travel Window *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? format(field.value, "PPP")
                                    : "Select a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => field.onChange(date)}
                                  initialFocus
                                  disabled={(date) => date < today}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="healthBackground"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Health Goals / Current Diagnosis *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={5}
                                placeholder="Describe your medical history, symptoms, or goals. Avoid full personal identifiers but include enough detail for our surgeons to triage."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="budgetRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Guidance (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Example: $6,000 - $8,000"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Travel Companions (optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Example: One spouse travelling"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="medicalReports"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Existing Medical Reports (optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Share links to imaging, lab results, or list reports you can email later."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Upload medical reports (optional)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, JPG, or PNG up to 10MB each. You can also
                              paste links above.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingDocuments}
                            >
                              {uploadingDocuments
                                ? "Uploading..."
                                : "Add attachments"}
                              <Upload className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Attachments are optional and help our surgeons
                              review faster.
                            </p>
                          </div>

                          <Input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALLOWED_FILE_TYPES}
                            className="hidden"
                            disabled={uploadingDocuments}
                            onChange={(event) => {
                              void handleDocumentSelection(event.target.files);
                              if (event.target) {
                                event.target.value = "";
                              }
                            }}
                          />

                          {documents.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No files uploaded yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {documents.map((document) => (
                                <div
                                  key={document.path}
                                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/80 px-3 py-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-foreground">
                                        {document.originalName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatFileSize(document.size)} •{" "}
                                        {new Date(
                                          document.uploadedAt,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      void removeDocument(document);
                                    }}
                                    disabled={uploadingDocuments}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="contactPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Preferred Communication Channel (optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Example: WhatsApp or Email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="additionalQuestions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Additional Questions (optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Anything else you'd like to ask?"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto"
                        disabled={isSubmitting || uploadingDocuments}
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : "Submit Consultation Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-muted/40 backdrop-blur">
                <CardHeader className="space-y-4">
                  <CardTitle className="text-xl">What happens next?</CardTitle>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Stethoscope
                        className="mt-1 h-5 w-5 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          Medical review in under 2 hours
                        </p>
                        <p>
                          Your request is triaged by our medical concierge team
                          who confirm treatment eligibility and clinic
                          availability.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin
                        className="mt-1 h-5 w-5 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          Destination matching
                        </p>
                        <p>
                          We shortlist clinics in your preferred location and
                          prepare a cost breakdown that aligns with your budget
                          guidance.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe2
                        className="mt-1 h-5 w-5 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          Travel coordination
                        </p>
                        <p>
                          From flights to recovery hotels, our team handles
                          logistics and can arrange companion travel if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
