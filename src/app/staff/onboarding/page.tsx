"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[0-9]/, "Include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol.");

const onboardingSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(120, "Name must be at most 120 characters."),
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

      const existingName =
        typeof metadata.username === "string" &&
        metadata.username.trim().length > 0
          ? metadata.username.trim()
          : typeof metadata.full_name === "string" &&
              metadata.full_name.trim().length > 0
            ? metadata.full_name.trim()
            : typeof userResult.user.email === "string"
              ? (userResult.user.email.split("@")[0] ?? "").replace(/\./g, " ")
              : "";

      if (existingName.length > 0) {
        form.reset({
          displayName: existingName,
          password: "",
          confirmPassword: "",
        });
      }

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

    const metadataUpdates: Record<string, unknown> = {
      username: displayName,
      full_name: displayName,
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
      .update({ username: displayName })
      .eq("user_id", user.id);

    if (profileError) {
      // Non-blocking: log error but continue onboarding.
      console.error("Failed to update staff profile:", profileError);
    }

    setStatus("success");
    toast({
      title: "Account secured",
      description: "Your password is set. Redirecting to the admin console…",
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
                Choose a strong password and confirm your display name. You can
                update these later from the Access console.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
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
                      Saving your password…
                    </>
                  ) : (
                    "Save and continue"
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
