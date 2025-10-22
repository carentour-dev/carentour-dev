"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  BookOpen,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  UserCircle,
  Sparkles,
  Star,
  Stethoscope,
  Video,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePatientPortalData } from "@/hooks/usePatientPortalData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  sexOptions,
  sexOptionValues,
  SexOptionValue,
} from "@/constants/profile";

const requestStatusLabels = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
} as const;

const consultationStatusLabels = {
  scheduled: "Scheduled",
  rescheduled: "Rescheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
} as const;

const appointmentStatusLabels = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
} as const;

type DoctorOption = Pick<
  Database["public"]["Tables"]["doctors"]["Row"],
  "id" | "name" | "title"
>;
type TreatmentOption = Pick<
  Database["public"]["Tables"]["treatments"]["Row"],
  "id" | "name" | "slug"
>;

const profileSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username cannot exceed 50 characters"),
  date_of_birth: z
    .string({ required_error: "Date of birth is required" })
    .min(1, "Date of birth is required"),
  sex: z.enum(sexOptionValues, {
    required_error: "Select the option that best describes your sex",
  }),
  nationality: z
    .string()
    .min(2, "Nationality is required")
    .max(80, "Nationality seems too long"),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 7,
      "Phone number looks incomplete",
    ),
});

const reviewSchema = z.object({
  doctor_id: z.string({ required_error: "Select a doctor" }).uuid(),
  treatment_id: z.string({ required_error: "Select a treatment" }).uuid(),
  rating: z.coerce.number({ required_error: "Select a rating" }).min(1).max(5),
  review_text: z
    .string()
    .min(20, "Please share at least a short paragraph about your experience."),
  procedure_name: z.string().max(160).optional(),
  recovery_time: z.string().max(160).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const storySchema = z.object({
  treatment_id: z.string({ required_error: "Select a treatment" }).uuid(),
  doctor_id: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().uuid().optional(),
  ),
  headline: z.string().min(6, "Please add a short headline."),
  excerpt: z.string().max(240).optional(),
  body_markdown: z.string().min(80, "Please share at least a few sentences."),
});

type StoryFormValues = z.infer<typeof storySchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, amount] of divisions) {
    if (Math.abs(diff) >= amount || unit === "minute") {
      return rtf.format(Math.round(diff / amount), unit);
    }
  }

  return "";
};

const scrollToSection = (id: string) => {
  if (typeof window === "undefined") return;
  const section = document.getElementById(id);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "new":
    case "scheduled":
    case "confirmed":
      return "default" as const;
    case "in_progress":
    case "rescheduled":
      return "secondary" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
    case "no_show":
    case "resolved":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, limit = 260) =>
  value.length <= limit ? value : `${value.slice(0, limit).trim()}…`;

const OPTIONAL_SELECT_NONE = "__none__";
const DEFAULT_SEX_OPTION: SexOptionValue = "prefer_not_to_say";
const STAFF_ROLES = [
  "admin",
  "coordinator",
  "doctor",
  "management",
  "employee",
  "editor",
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    refresh: refreshProfile,
  } = useUserProfile();
  const isStaffAccount = useMemo(() => {
    if (profile && profile.hasAnyRole(STAFF_ROLES)) {
      return true;
    }
    const metadataType =
      typeof user?.user_metadata?.account_type === "string"
        ? user.user_metadata.account_type.toLowerCase()
        : null;
    if (metadataType === "staff") {
      return true;
    }
    const rawRoles = Array.isArray(user?.user_metadata?.staff_roles)
      ? (user?.user_metadata?.staff_roles as string[])
      : [];
    return rawRoles.some((role) => STAFF_ROLES.includes(role.toLowerCase()));
  }, [profile, user?.user_metadata]);

  useEffect(() => {
    if (!authLoading && !profileLoading && isStaffAccount) {
      router.replace("/admin");
    }
  }, [authLoading, profileLoading, isStaffAccount, router]);

  const {
    patient,
    requests,
    consultations,
    appointments,
    reviews,
    stories,
    isLoading: portalLoading,
    error,
    refetch,
  } = usePatientPortalData({ enabled: !profileLoading && !isStaffAccount });
  const { toast } = useToast();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);

  const {
    data: treatmentOptions = [],
    isLoading: treatmentsLoading,
    error: treatmentsError,
  } = useQuery({
    queryKey: ["dashboard", "treatments"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message ?? "Failed to load treatments");
      }

      return (data ?? []) as TreatmentOption[];
    },
  });

  const {
    data: doctorOptions = [],
    isLoading: doctorsLoading,
    error: doctorsError,
  } = useQuery({
    queryKey: ["dashboard", "doctors"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name, title")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message ?? "Failed to load doctors");
      }

      return (data ?? []) as DoctorOption[];
    },
  });

  const fallbackPatientName = useMemo(() => {
    const patientName =
      typeof patient?.full_name === "string" ? patient.full_name.trim() : "";
    if (patientName.length > 0) {
      return patientName;
    }

    const metaFullName =
      typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "";
    if (metaFullName.length > 0) {
      return metaFullName;
    }

    const metaUsername =
      typeof user?.user_metadata?.username === "string"
        ? user.user_metadata.username.trim()
        : "";
    if (metaUsername.length > 0) {
      return metaUsername;
    }

    const displayName = profile?.displayName?.trim();
    if (displayName && displayName.length > 0 && displayName !== "User") {
      return displayName;
    }

    const emailLocalPart =
      typeof user?.email === "string"
        ? (user.email.split("@")[0]?.trim() ?? "")
        : "";
    if (emailLocalPart.length > 0) {
      return emailLocalPart;
    }

    return "Care N Tour Patient";
  }, [
    patient?.full_name,
    profile?.displayName,
    user?.email,
    user?.user_metadata,
  ]);

  const preferredLocale =
    typeof patient?.preferred_language === "string" &&
    patient.preferred_language.trim().length > 0
      ? patient.preferred_language
      : "en";
  const maxProfileDob = new Date().toISOString().split("T")[0];

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      date_of_birth: "",
      sex: DEFAULT_SEX_OPTION,
      nationality: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!profile) {
      profileForm.reset({
        username: "",
        date_of_birth: "",
        sex: DEFAULT_SEX_OPTION,
        nationality: "",
        phone: "",
      });
      return;
    }

    const selectedSex = sexOptionValues.includes(
      (profile.sex ?? "") as SexOptionValue,
    )
      ? (profile.sex as SexOptionValue)
      : DEFAULT_SEX_OPTION;

    profileForm.reset({
      username: profile.username ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      sex: selectedSex,
      nationality: profile.nationality ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile, profileForm]);

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) {
        throw new Error("You need to be signed in to update your profile.");
      }

      const payload = {
        username: values.username.trim(),
        date_of_birth: values.date_of_birth,
        sex: values.sex,
        nationality: values.nationality.trim(),
        phone: values.phone.trim(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message ?? "Failed to update profile");
      }

      try {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: payload,
        });

        if (metadataError) {
          console.warn(
            "Profile updated but metadata sync failed:",
            metadataError,
          );
        }
      } catch (metadataSyncError) {
        console.warn(
          "Unexpected error syncing auth metadata:",
          metadataSyncError,
        );
      }
    },
    onSuccess: async (_data, values) => {
      await refreshProfile();

      profileForm.reset({
        username: values.username.trim(),
        date_of_birth: values.date_of_birth,
        sex: values.sex,
        nationality: values.nationality.trim(),
        phone: values.phone.trim(),
      });

      toast({
        title: "Profile updated",
        description: "Your personal details have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      review_text: "",
      procedure_name: "",
      recovery_time: "",
    },
  });

  const storyForm = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      headline: "",
      excerpt: "",
      body_markdown: "",
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!patient) {
        throw new Error(
          "We could not find your patient profile. Please try again.",
        );
      }

      const { error } = await supabase.from("doctor_reviews").insert([
        {
          doctor_id: values.doctor_id,
          treatment_id: values.treatment_id,
          patient_id: patient.id,
          rating: Math.round(values.rating),
          review_text: values.review_text.trim(),
          recovery_time: values.recovery_time?.trim()
            ? values.recovery_time.trim()
            : null,
          procedure_name: values.procedure_name?.trim()
            ? values.procedure_name.trim()
            : null,
          patient_name: fallbackPatientName,
          patient_country: patient.nationality ?? null,
          locale: preferredLocale,
          published: false,
          highlight: false,
          is_verified: false,
        },
      ]);

      if (error) {
        throw new Error(error.message ?? "Failed to submit review");
      }
    },
    onSuccess: async () => {
      await refetch();
      reviewForm.reset({
        doctor_id: undefined,
        treatment_id: undefined,
        rating: 5,
        review_text: "",
        procedure_name: "",
        recovery_time: "",
      });
      setReviewDialogOpen(false);
      toast({
        title: "Review submitted",
        description:
          "Thank you for sharing your feedback! Our concierge team will review it shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const storyMutation = useMutation({
    mutationFn: async (values: StoryFormValues) => {
      if (!patient) {
        throw new Error(
          "We could not find your patient profile. Please try again.",
        );
      }

      const doctorId = values.doctor_id?.trim() ?? "";

      const { error } = await supabase.from("patient_stories").insert([
        {
          patient_id: patient.id,
          doctor_id: doctorId.length > 0 ? doctorId : null,
          treatment_id: values.treatment_id,
          headline: values.headline.trim(),
          excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
          body_markdown: values.body_markdown.trim(),
          locale: preferredLocale,
          published: false,
          featured: false,
          hero_image: null,
        },
      ]);

      if (error) {
        throw new Error(error.message ?? "Failed to submit story");
      }
    },
    onSuccess: async () => {
      await refetch();
      storyForm.reset({
        headline: "",
        excerpt: "",
        body_markdown: "",
        doctor_id: undefined,
        treatment_id: undefined,
      });
      setStoryDialogOpen(false);
      toast({
        title: "Story submitted",
        description:
          "Thank you for sharing your journey! We will review your story before publishing.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to submit story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const profileSaving = profileMutation.isPending;
  const isProfileDirty = profileForm.formState.isDirty;
  const disableProfileFields = profileSaving || profileLoading;
  const reviewSubmitting = reviewMutation.isPending;
  const storySubmitting = storyMutation.isPending;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  const isLoading = authLoading || profileLoading || portalLoading;

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status !== "resolved"),
    [requests],
  );

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime(),
      ),
    [requests],
  );

  const upcomingConsultations = useMemo(() => {
    const now = Date.now();
    return consultations
      .filter((consultation) => {
        if (!consultation.scheduled_at) return false;
        const schedule = new Date(consultation.scheduled_at).getTime();
        return (
          schedule >= now &&
          (consultation.status === "scheduled" ||
            consultation.status === "rescheduled")
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at ?? "").getTime() -
          new Date(b.scheduled_at ?? "").getTime(),
      );
  }, [consultations]);

  const nextConsultation = upcomingConsultations[0] ?? null;

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    const activeStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);
    return appointments
      .filter((appointment) => {
        if (!appointment.starts_at) return false;
        const start = new Date(appointment.starts_at).getTime();
        return start >= now && activeStatuses.has(appointment.status);
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at ?? "").getTime() -
          new Date(b.starts_at ?? "").getTime(),
      );
  }, [appointments]);

  const recentReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) =>
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime(),
      ),
    [reviews],
  );

  const recentStories = useMemo(
    () =>
      [...stories].sort(
        (a, b) =>
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime(),
      ),
    [stories],
  );

  const handleProfileReset = () => {
    if (profile) {
      const selectedSex = sexOptionValues.includes(
        (profile.sex ?? "") as SexOptionValue,
      )
        ? (profile.sex as SexOptionValue)
        : DEFAULT_SEX_OPTION;

      profileForm.reset({
        username: profile.username ?? "",
        date_of_birth: profile.date_of_birth ?? "",
        sex: selectedSex,
        nationality: profile.nationality ?? "",
        phone: profile.phone ?? "",
      });
      return;
    }

    profileForm.reset({
      username: "",
      date_of_birth: "",
      sex: DEFAULT_SEX_OPTION,
      nationality: "",
      phone: "",
    });
  };

  const quickActions = [
    {
      title: "Start a New Request",
      description:
        pendingRequests.length > 0
          ? `${pendingRequests.length} active request${pendingRequests.length === 1 ? "" : "s"}`
          : "Tell us what you need next",
      icon: Inbox,
      action: () => router.push("/contact"),
      accentClass:
        "bg-sky-500/15 text-sky-600 dark:text-sky-100 group-hover:bg-sky-500/25 group-hover:text-sky-700 dark:group-hover:text-sky-50",
    },
    {
      title: "Schedule Consultation",
      description: nextConsultation
        ? `Next on ${formatDateTime(nextConsultation.scheduled_at)}`
        : "Book time with your coordinator",
      icon: CalendarCheck,
      action: () => router.push("/consultation"),
      accentClass:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-100 group-hover:bg-emerald-500/25 group-hover:text-emerald-700 dark:group-hover:text-emerald-50",
    },
    {
      title: "View Appointments",
      description:
        upcomingAppointments.length > 0
          ? `${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length === 1 ? "" : "s"}`
          : "Keep track of your visit schedule",
      icon: CalendarDays,
      action: () => scrollToSection("appointments"),
      accentClass:
        "bg-blue-500/15 text-blue-600 dark:text-blue-100 group-hover:bg-blue-500/25 group-hover:text-blue-700 dark:group-hover:text-blue-50",
    },
    {
      title: "Share a Review",
      description:
        reviews.length > 0
          ? "View and update your feedback"
          : "Help future patients by sharing your story",
      icon: Star,
      action: () => setReviewDialogOpen(true),
      accentClass:
        "bg-amber-500/15 text-amber-600 dark:text-amber-100 group-hover:bg-amber-500/25 group-hover:text-amber-700 dark:group-hover:text-amber-50",
    },
    {
      title: "Share Your Story",
      description:
        stories.length > 0
          ? "Submit another journey to inspire others"
          : "Tell others about your experience in Egypt",
      icon: BookOpen,
      action: () => setStoryDialogOpen(true),
      accentClass:
        "bg-violet-500/15 text-violet-600 dark:text-violet-100 group-hover:bg-violet-500/25 group-hover:text-violet-700 dark:group-hover:text-violet-50",
    },
  ];

  if (!user) {
    return null;
  }

  if (!authLoading && !profileLoading && isStaffAccount) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Redirecting you to the admin console…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
            <div className="flex items-center gap-4 xl:col-span-2">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={profile?.avatar_url ?? undefined}
                  alt="User avatar"
                />
                <AvatarFallback className="text-lg bg-primary/10">
                  {profile?.initials ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back
                  {profile?.displayName ? `, ${profile.displayName}` : ""} 👋
                </h1>
                <p className="text-muted-foreground">
                  Track your requests, appointments, and progress from one
                  place.
                </p>
              </div>
            </div>
            {patient && (
              <div className="w-full rounded-2xl border border-border/60 bg-muted/20 px-6 py-5 text-left shadow-sm xl:col-span-1">
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="text-lg font-semibold text-foreground">
                  {patient.id}
                </p>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <Card className="mb-8 border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">
                We couldn&apos;t load your dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-destructive">
              <p>{error}</p>
              <Button variant="destructive" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading your patient portal…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    Profile details
                  </CardTitle>
                  <CardDescription>
                    Keep your demographic and contact details current so we can
                    personalize your care.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit((values) =>
                        profileMutation.mutate(values),
                      )}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Display name"
                                  disabled={disableProfileFields}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of birth</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  max={maxProfileDob}
                                  disabled={disableProfileFields}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="sex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sex</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={disableProfileFields}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sexOptions.map((option) => (
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
                          control={profileForm.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. Egyptian"
                                  disabled={disableProfileFields}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                {...field}
                                placeholder="Include country code, e.g. +20 555 123456"
                                disabled={disableProfileFields}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleProfileReset}
                          disabled={disableProfileFields || !isProfileDirty}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={disableProfileFields || !isProfileDirty}
                        >
                          {profileSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.title}
                          variant="ghost"
                          className="group h-full justify-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          onClick={action.action}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                              action.accentClass,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold tracking-tight transition-colors group-hover:text-foreground">
                              {action.title}
                            </div>
                            <div className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                              {action.description}
                            </div>
                          </div>
                          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card id="requests">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-primary" />
                      Your requests
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {requests.length === 0
                        ? "You haven't submitted any requests yet."
                        : "Track the status of requests you submitted to our care team."}
                    </p>
                  </div>
                  <Badge
                    variant={pendingRequests.length > 0 ? "default" : "outline"}
                  >
                    {pendingRequests.length} active
                  </Badge>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">
                        No requests yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Need help planning or have questions? Submit a request
                        and our team will respond quickly.
                      </p>
                      <Button
                        className="mt-3"
                        onClick={() => router.push("/contact")}
                      >
                        Start a request
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedRequests.slice(0, 5).map((request) => (
                        <div
                          key={request.id}
                          className="rounded-xl border border-border/60 bg-muted/10 p-4 transition-colors hover:border-primary/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                {request.request_type === "consultation"
                                  ? "Consultation request"
                                  : "General inquiry"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDateTime(request.created_at)}
                              </p>
                            </div>
                            <Badge
                              variant={statusBadgeVariant(request.status)}
                              className="capitalize"
                            >
                              {requestStatusLabels[request.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Treatment interest
                              </p>
                              <p className="text-sm">
                                {request.treatment &&
                                request.treatment.trim().length > 0
                                  ? request.treatment
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Origin
                              </p>
                              <p className="text-sm capitalize">
                                {request.origin ?? "web"}
                              </p>
                            </div>
                          </div>
                          {request.notes ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Team notes: {request.notes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                      {requests.length > 5 ? (
                        <p className="text-xs text-muted-foreground">
                          Showing latest five requests. Contact your coordinator
                          for older submissions.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="reviews">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Your reviews
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {reviews.length === 0
                        ? "Share your experience to help future patients."
                        : "Review the feedback you've shared with our network."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setReviewDialogOpen(true)}>
                      <Star className="mr-2 h-4 w-4" />
                      Share review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">
                        No reviews yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        We celebrate every story. Reach out to your coordinator
                        when you&apos;re ready to share yours.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentReviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className="rounded-xl border border-border/60 bg-muted/10 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {review.doctors?.name ??
                                  "Care N Tour Specialist"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Shared {formatDateTime(review.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={cn(
                                    "h-4 w-4",
                                    index < Math.round(review.rating ?? 0)
                                      ? "fill-amber-500"
                                      : "opacity-30",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                            {review.review_text}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {review.treatments?.name ? (
                              <span className="rounded-full bg-muted px-3 py-1">
                                Treatment: {review.treatments.name}
                              </span>
                            ) : null}
                            {review.recovery_time ? (
                              <span className="rounded-full bg-muted px-3 py-1">
                                Recovery: {review.recovery_time}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-muted px-3 py-1">
                              Visibility:{" "}
                              {review.published ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {reviews.length > 3 ? (
                        <p className="text-xs text-muted-foreground">
                          Showing your three most recent reviews. Contact your
                          coordinator to update older feedback.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="stories">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Your stories
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {stories.length === 0
                        ? "Share your medical journey—your experience can inspire another patient."
                        : "Keep track of the stories you've shared with our community."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setStoryDialogOpen(true)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Share story
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">
                        No stories yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        When you&apos;re ready, click &quot;Share story&quot; to
                        tell others about your Care N Tour journey.
                      </p>
                      <Button
                        className="mt-3"
                        onClick={() => setStoryDialogOpen(true)}
                      >
                        Share your first story
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentStories.slice(0, 2).map((story) => {
                        const source =
                          story.excerpt && story.excerpt.trim().length > 0
                            ? story.excerpt
                            : story.body_markdown;
                        const preview = truncate(stripMarkdown(source));

                        return (
                          <div
                            key={story.id}
                            className="rounded-xl border border-border/60 bg-muted/10 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  {story.headline}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Shared {formatDateTime(story.created_at)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  story.published ? "default" : "outline"
                                }
                              >
                                {story.published ? "Published" : "Under review"}
                              </Badge>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                              {preview}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {story.treatments?.name ? (
                                <span className="rounded-full bg-muted px-3 py-1">
                                  Treatment: {story.treatments.name}
                                </span>
                              ) : null}
                              {story.doctors?.name ? (
                                <span className="rounded-full bg-muted px-3 py-1">
                                  Doctor: {story.doctors.name}
                                </span>
                              ) : null}
                              <span className="rounded-full bg-muted px-3 py-1">
                                Visibility:{" "}
                                {story.published ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {stories.length > 2 ? (
                        <p className="text-xs text-muted-foreground">
                          Showing your two most recent stories. Contact your
                          concierge if you&apos;d like to update an older one.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card id="consultation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Scheduled consultation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingConsultations.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingConsultations.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="rounded-lg border border-border/70 bg-muted/10 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {formatDateTime(consultation.scheduled_at)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(consultation.scheduled_at)}
                              </p>
                            </div>
                            <Badge
                              variant={statusBadgeVariant(consultation.status)}
                            >
                              {consultationStatusLabels[consultation.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {consultation.doctors ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Stethoscope className="h-4 w-4" />
                                <span>{consultation.doctors.name}</span>
                              </div>
                            ) : null}
                            {consultation.location ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{consultation.location}</span>
                              </div>
                            ) : null}
                            {consultation.meeting_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  window.open(
                                    consultation.meeting_url ?? "#",
                                    "_blank",
                                  )
                                }
                              >
                                <Video className="mr-2 h-4 w-4" />
                                Join virtual meeting
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {consultations.length > upcomingConsultations.length ? (
                        <p className="text-xs text-muted-foreground">
                          Showing {upcomingConsultations.length} upcoming
                          consultations. Contact your coordinator for past
                          visits or schedule changes.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">
                        No consultations scheduled
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        When your first consultation is confirmed, we&apos;ll
                        list it here with preparation steps.
                      </p>
                      <Button
                        className="mt-3"
                        onClick={() => router.push("/consultation")}
                      >
                        Schedule consultation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="appointments">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Upcoming appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">
                        No appointments scheduled
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your upcoming visits will appear here once they&apos;re
                        confirmed by the care team.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="rounded-lg border border-border/70 bg-muted/10 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {appointment.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {appointment.appointment_type}
                              </p>
                            </div>
                            <Badge
                              variant={statusBadgeVariant(appointment.status)}
                            >
                              {appointmentStatusLabels[appointment.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatDateTime(appointment.starts_at)}
                              </span>
                            </div>
                            {appointment.location ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.location}</span>
                              </div>
                            ) : null}
                            {appointment.doctors ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Stethoscope className="h-4 w-4" />
                                <span>{appointment.doctors.name}</span>
                              </div>
                            ) : null}
                            {appointment.pre_visit_instructions ? (
                              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                {appointment.pre_visit_instructions}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {appointments.length > upcomingAppointments.length ? (
                        <p className="text-xs text-muted-foreground">
                          Showing the next {upcomingAppointments.length}{" "}
                          appointments. Contact your coordinator for the full
                          schedule.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Need help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Our medical coordinators are here to help with any questions
                    about next steps, travel arrangements, or medical records.
                  </p>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => router.push("/contact")}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message concierge
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href="tel:+201001741666">
                        <Phone className="mr-2 h-4 w-4" />
                        +20 100 174 1666
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Travel resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Access our travel guides, accommodation partners, and
                    recovery planning tips to make your medical journey
                    seamless.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/travel-info">View travel guide</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <Dialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) {
            reviewMutation.reset();
            reviewForm.reset({
              doctor_id: undefined,
              treatment_id: undefined,
              rating: 5,
              review_text: "",
              procedure_name: "",
              recovery_time: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share a patient review</DialogTitle>
            <DialogDescription>
              Your review stays private until our concierge team verifies it.
              Once approved, it appears on the relevant doctor and treatment
              pages.
            </DialogDescription>
          </DialogHeader>
          <Form {...reviewForm}>
            <form
              onSubmit={reviewForm.handleSubmit((values) =>
                reviewMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={reviewForm.control}
                name="treatment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={treatmentsLoading || reviewSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              treatmentsLoading
                                ? "Loading treatments…"
                                : "Select treatment"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {treatmentOptions.length === 0 && !treatmentsLoading ? (
                          <SelectItem value="no-treatments" disabled>
                            No treatments found
                          </SelectItem>
                        ) : null}
                        {treatmentOptions.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {treatment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {treatmentsError instanceof Error ? (
                      <p className="text-sm text-destructive">
                        {treatmentsError.message ??
                          "We couldn't load treatments right now."}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="doctor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead doctor</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={doctorsLoading || reviewSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              doctorsLoading
                                ? "Loading doctors…"
                                : "Select doctor"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctorOptions.length === 0 && !doctorsLoading ? (
                          <SelectItem value="no-doctors" disabled>
                            No doctors found
                          </SelectItem>
                        ) : null}
                        {doctorOptions.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                            {doctor.title ? ` — ${doctor.title}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {doctorsError instanceof Error ? (
                      <p className="text-sm text-destructive">
                        {doctorsError.message ??
                          "We couldn't load doctors right now."}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={reviewSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value} star{value === 1 ? "" : "s"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="recovery_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recovery time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 2 weeks"
                          {...field}
                          disabled={reviewSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={reviewForm.control}
                name="procedure_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedure name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Full arch dental implants"
                        {...field}
                        disabled={reviewSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="review_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your experience</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Share highlights from your care, recovery support, or travel experience."
                        {...field}
                        disabled={reviewSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={reviewSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    reviewSubmitting ||
                    treatmentsLoading ||
                    doctorsLoading ||
                    treatmentOptions.length === 0 ||
                    doctorOptions.length === 0
                  }
                >
                  {reviewSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Submit review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={storyDialogOpen}
        onOpenChange={(open) => {
          setStoryDialogOpen(open);
          if (!open) {
            storyMutation.reset();
            storyForm.reset({
              doctor_id: undefined,
              treatment_id: undefined,
              headline: "",
              excerpt: "",
              body_markdown: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Share your Care N Tour story</DialogTitle>
            <DialogDescription>
              Outline your journey from consultation to recovery. We&apos;ll
              polish formatting and confirm details before it goes live on the
              Patient Stories page.
            </DialogDescription>
          </DialogHeader>
          <Form {...storyForm}>
            <form
              onSubmit={storyForm.handleSubmit((values) =>
                storyMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={storyForm.control}
                name="treatment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={treatmentsLoading || storySubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              treatmentsLoading
                                ? "Loading treatments…"
                                : "Select treatment"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {treatmentOptions.length === 0 && !treatmentsLoading ? (
                          <SelectItem value="no-treatments" disabled>
                            No treatments found
                          </SelectItem>
                        ) : null}
                        {treatmentOptions.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {treatment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {treatmentsError instanceof Error ? (
                      <p className="text-sm text-destructive">
                        {treatmentsError.message ??
                          "We couldn't load treatments right now."}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storyForm.control}
                name="doctor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead doctor (optional)</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(
                          value === OPTIONAL_SELECT_NONE ? "" : value,
                        )
                      }
                      disabled={doctorsLoading || storySubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              doctorsLoading
                                ? "Loading doctors…"
                                : "Select doctor"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OPTIONAL_SELECT_NONE}>
                          No specific doctor
                        </SelectItem>
                        {doctorOptions.length === 0 && !doctorsLoading ? (
                          <SelectItem value="no-doctors" disabled>
                            No doctors found
                          </SelectItem>
                        ) : null}
                        {doctorOptions.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                            {doctor.title ? ` — ${doctor.title}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {doctorsError instanceof Error ? (
                      <p className="text-sm text-destructive">
                        {doctorsError.message ??
                          "We couldn't load doctors right now."}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storyForm.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A life-changing recovery in Cairo"
                        {...field}
                        disabled={storySubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storyForm.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short summary (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Summarize your journey in a couple of sentences."
                        {...field}
                        disabled={storySubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storyForm.control}
                name="body_markdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full story</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        placeholder="Share your initial concerns, the Care N Tour support you received, and how you feel after treatment."
                        {...field}
                        disabled={storySubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStoryDialogOpen(false)}
                  disabled={storySubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    storySubmitting ||
                    treatmentsLoading ||
                    treatmentOptions.length === 0
                  }
                >
                  {storySubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Submit story
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
