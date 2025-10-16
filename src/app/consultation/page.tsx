"use client";

import { useEffect, useMemo, useState } from "react";
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
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTreatments } from "@/hooks/useTreatments";
import { COUNTRY_OPTIONS } from "@/constants/countries";

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
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

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
  const { session } = useAuth();

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
    },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { treatments: treatmentRows, loading: treatmentsLoading } =
    useTreatments();

  const treatments = useMemo(() => treatmentRows, [treatmentRows]);

  const selectedTreatmentId = form.watch("treatmentId");

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

  const handleSubmit = async (values: ConsultationFormValues) => {
    setIsSubmitting(true);

    try {
      const selectedTreatmentName =
        treatments.find((treatment) => treatment.id === values.treatmentId)
          ?.name ?? "";

      const combinedTreatment = [selectedTreatmentName, values.procedure]
        .filter((part) => part && part.length > 0)
        .join(" — ");

      const { treatmentId, procedure, travelWindow, ...rest } = values;

      const submissionPayload = {
        ...rest,
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
                        disabled={isSubmitting}
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
