"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[0-9]/, "Include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol.");

const sexOptions = [
  "female",
  "male",
  "non-binary",
  "prefer_not_to_say",
] as const;
const phoneRegex = /^[+0-9()[\]\s-]{6,}$/;

const onboardingSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(120, "Name must be at most 120 characters."),
    avatarUrl: z
      .string()
      .url("Upload a valid image.")
      .max(2048, "Avatar URL is too long.")
      .optional()
      .nullable(),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, "Date of birth is required.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.")
      .refine(
        (value) => {
          const parsed = new Date(value);
          return !Number.isNaN(parsed.getTime());
        },
        { message: "Enter a valid date." },
      ),
    nationality: z
      .string()
      .trim()
      .min(2, "Nationality must be at least 2 characters.")
      .max(120, "Nationality must be at most 120 characters."),
    jobTitle: z
      .string()
      .trim()
      .min(2, "Job title must be at least 2 characters.")
      .max(180, "Job title must be at most 180 characters."),
    phone: z
      .string()
      .trim()
      .min(6, "Phone number must be at least 6 characters long.")
      .max(40, "Phone number must be at most 40 characters long.")
      .regex(
        phoneRegex,
        "Phone number can only include digits, spaces, parentheses, dashes, or '+'",
      ),
    sex: z.enum(sexOptions, {
      required_error: "Select the option that best matches your sex.",
    }),
    language: z
      .string()
      .trim()
      .min(2, "Preferred language must be at least 2 characters.")
      .max(80, "Preferred language must be at most 80 characters."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

type StatusState = "checking" | "ready" | "saving" | "success" | "error";

const STAFF_ACCOUNT_TYPE = "staff";
const ALLOWED_FLOW_TYPES = new Set(["invite", "magiclink"]);
const sexOptionLabels: Record<(typeof sexOptions)[number], string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};

function parseHashParams(): URLSearchParams | null {
  if (typeof window === "undefined") {
    return null;
  }
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) {
    return null;
  }
  return new URLSearchParams(hash);
}

export default function StaffOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusState>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      avatarUrl: null,
      dateOfBirth: "",
      nationality: "",
      jobTitle: "",
      phone: "",
      sex: "prefer_not_to_say",
      language: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const bootstrap = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const params =
        parseHashParams() ?? new URLSearchParams(window.location.search);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const flowType = params.get("type");

      if (!accessToken || !refreshToken) {
        setErrorMessage(
          "This invitation link is missing login information. Request a fresh invite from your administrator.",
        );
        setStatus("error");
        return;
      }

      if (flowType && !ALLOWED_FLOW_TYPES.has(flowType)) {
        setErrorMessage(
          "This link is not a staff invitation. Please use the invitation email we sent you.",
        );
        setStatus("error");
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setErrorMessage(
          sessionError.message ??
            "Unable to authenticate your session. Request a new invitation.",
        );
        setStatus("error");
        return;
      }

      // Remove tokens from the URL once session is set.
      window.history.replaceState({}, document.title, window.location.pathname);

      const { data: userResult, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userResult.user) {
        setErrorMessage(
          userError?.message ?? "Unable to load your profile after signing in.",
        );
        setStatus("error");
        return;
      }

      const metadata = (userResult.user.user_metadata ?? {}) as Record<
        string,
        unknown
      >;

      if (metadata.account_type !== STAFF_ACCOUNT_TYPE) {
        router.replace("/dashboard");
        return;
      }

      if (metadata.staff_onboarding_completed) {
        router.replace("/admin");
        return;
      }

      setUser(userResult.user);

      const metadataString = (key: string): string | null => {
        const value = metadata[key];
        return typeof value === "string" && value.trim().length > 0
          ? value.trim()
          : null;
      };

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "username, avatar_url, date_of_birth, nationality, phone, sex, job_title, language",
        )
        .eq("user_id", userResult.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error(
          "Failed to load staff profile for onboarding:",
          profileError,
        );
      }

      const profileUsername =
        typeof profileData?.username === "string" &&
        profileData.username.trim().length > 0
          ? profileData.username.trim()
          : null;

      const existingName =
        metadataString("username") ??
        metadataString("full_name") ??
        profileUsername ??
        (typeof userResult.user.email === "string"
          ? (userResult.user.email.split("@")[0] ?? "").replace(/\./g, " ")
          : "");

      const existingDateOfBirth =
        metadataString("date_of_birth") ?? profileData?.date_of_birth ?? "";
      const existingNationality =
        metadataString("nationality") ?? profileData?.nationality ?? "";
      const existingJobTitle =
        metadataString("job_title") ??
        metadataString("job") ??
        profileData?.job_title ??
        "";
      const existingPhone = metadataString("phone") ?? profileData?.phone ?? "";

      const existingSexMetadata = metadataString("sex");
      const existingProfileSex = profileData?.sex ?? "";
      const resolvedSex =
        existingSexMetadata &&
        sexOptions.includes(existingSexMetadata as (typeof sexOptions)[number])
          ? (existingSexMetadata as (typeof sexOptions)[number])
          : sexOptions.includes(
                existingProfileSex as (typeof sexOptions)[number],
              )
            ? (existingProfileSex as (typeof sexOptions)[number])
            : "prefer_not_to_say";

      const existingLanguage =
        metadataString("language") ??
        metadataString("preferred_language") ??
        profileData?.language ??
        "";
      const existingAvatar =
        metadataString("avatar_url") ?? profileData?.avatar_url ?? null;

      form.reset({
        displayName: existingName ?? "",
        avatarUrl: existingAvatar,
        dateOfBirth: existingDateOfBirth ?? "",
        nationality: existingNationality ?? "",
        jobTitle: existingJobTitle ?? "",
        phone: existingPhone ?? "",
        sex: resolvedSex,
        language: existingLanguage ?? "",
        password: "",
        confirmPassword: "",
      });

      setStatus("ready");
    };

    bootstrap();
  }, [form, router]);

  const greeting = useMemo(() => {
    if (!user?.email) {
      return "Welcome!";
    }
    const localPart = user.email.split("@")[0] ?? "";
    if (!localPart) {
      return "Welcome!";
    }
    return `Welcome, ${localPart}!`;
  }, [user?.email]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      setErrorMessage("Your session expired. Request a new invitation.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    const displayName = values.displayName.trim();
    const dateOfBirth = values.dateOfBirth.trim();
    const nationality = values.nationality.trim();
    const jobTitle = values.jobTitle.trim();
    const phone = values.phone.trim();
    const language = values.language.trim();
    const sex = values.sex;
    const avatarUrl = values.avatarUrl ?? null;

    const metadataUpdates: Record<string, unknown> = {
      username: displayName,
      full_name: displayName,
      date_of_birth: dateOfBirth,
      nationality,
      job_title: jobTitle,
      phone,
      language,
      sex,
      avatar_url: avatarUrl,
      staff_onboarding_completed: true,
    };

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
      data: metadataUpdates,
    });

    if (updateError) {
      setErrorMessage(
        updateError.message ??
          "We couldn't save your password. Please try again or request a new invite.",
      );
      setStatus("ready");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: displayName,
        date_of_birth: dateOfBirth || null,
        nationality: nationality || null,
        job_title: jobTitle || null,
        phone: phone || null,
        language: language || null,
        sex,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user.id);

    if (profileError) {
      // Non-blocking: log error but continue onboarding.
      console.error("Failed to update staff profile:", profileError);
    }

    setStatus("success");
    toast({
      title: "Staff profile saved",
      description: "Your details are secure. Redirecting to the admin console…",
    });

    setTimeout(() => {
      router.replace("/admin");
    }, 1200);
  });

  const isSaving = status === "saving";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s finish setting up your Care N Tour team account so you
            can access the admin console.
          </p>
        </div>

        {status === "error" && errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>We couldn&apos;t finish onboarding</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {status === "checking" ? (
          <Card className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                Verifying invitation…
              </CardTitle>
              <CardDescription>
                Give us a moment while we confirm your invite details.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {status === "ready" || status === "saving" ? (
          <Card className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Secure your account
              </CardTitle>
              <CardDescription>
                Secure your account and confirm the staff details we use across
                the Access console. You can refine them later from the admin
                area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <Controller
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <AvatarUploader
                        label="Profile photo"
                        description="PNG or JPG up to 5MB"
                        value={field.value ?? null}
                        onChange={(next) => field.onChange(next ?? null)}
                        disabled={isSaving}
                        userId={user?.id ?? null}
                      />
                      {form.formState.errors.avatarUrl ? (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.avatarUrl.message}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          We use this in the admin console and internal tools.
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="displayName"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Display name
                  </Label>
                  <Input
                    id="displayName"
                    placeholder="e.g. Amira Lewis"
                    {...form.register("displayName")}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    This name appears in the Access console and internal tools.
                  </p>
                  {form.formState.errors.displayName ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.displayName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                    disabled={isSaving}
                  />
                  {form.formState.errors.dateOfBirth ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      We keep this private and only use it for staff records.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor="nationality"
                      className="text-sm font-medium"
                    >
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      placeholder="e.g. Egyptian"
                      {...form.register("nationality")}
                      disabled={isSaving}
                    />
                    {form.formState.errors.nationality ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nationality.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Used for travel compliance and HR documentation.
                      </p>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm font-medium">
                      Job title
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Patient Coordinator"
                      {...form.register("jobTitle")}
                      disabled={isSaving}
                    />
                    {form.formState.errors.jobTitle ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.jobTitle.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +20 10 1234 5678"
                      {...form.register("phone")}
                      disabled={isSaving}
                    />
                    {form.formState.errors.phone ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Shared internally for urgent coordination only.
                      </p>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name="sex"
                    render={({ field }) => {
                      const fieldError = form.formState.errors.sex;
                      return (
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="sex" className="text-sm font-medium">
                            Sex
                          </Label>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSaving}
                          >
                            <SelectTrigger id="sex">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {sexOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {sexOptionLabels[option]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldError ? (
                            <p className="text-sm text-destructive">
                              {fieldError.message}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Choose the option that best reflects your HR
                              records.
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Preferred language
                  </Label>
                  <Input
                    id="language"
                    placeholder="e.g. English, Arabic"
                    {...form.register("language")}
                    disabled={isSaving}
                  />
                  {form.formState.errors.language ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.language.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Helps us pair you with the right patients and partners.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    New password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Set a strong password"
                    {...form.register("password")}
                    disabled={isSaving}
                  />
                  {form.formState.errors.password ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use at least 8 characters, mixing uppercase, lowercase,
                      numbers, and symbols.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    {...form.register("confirmPassword")}
                    disabled={isSaving}
                  />
                  {form.formState.errors.confirmPassword ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving your details…
                    </>
                  ) : (
                    "Save details and continue"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {status === "success" ? (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Password updated
              </CardTitle>
              <CardDescription>
                Redirecting you to the admin console. If you are not redirected
                automatically, use the button below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.replace("/admin")}
              >
                Go to Admin Console
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
