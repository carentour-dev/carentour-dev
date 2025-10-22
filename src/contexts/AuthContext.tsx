"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSecurity } from "@/hooks/useSecurity";

interface SignUpPayload {
  email: string;
  password: string;
  username?: string;
  dateOfBirth?: string;
  sex?: string;
  nationality?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (payload: SignUpPayload) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearSupabaseAuthStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  const authClient = supabase.auth as unknown as { storageKey?: string };
  const storageKey = authClient?.storageKey;

  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(`${storageKey}-code-verifier`);
  } catch (storageError) {
    console.error("Failed to clear Supabase auth storage:", storageError);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkRateLimit, recordLoginAttempt, logSecurityEvent } =
    useSecurity();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle email verification redirect
      if (
        event === "SIGNED_IN" &&
        session?.user &&
        window.location.pathname === "/"
      ) {
        window.location.href = "/dashboard";
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Check rate limit before attempting login
      const rateLimitResult = await checkRateLimit(email);

      if (!rateLimitResult.allowed) {
        await logSecurityEvent({
          event_type: "login_blocked_rate_limit",
          event_data: {
            email,
            reason: rateLimitResult.reason,
            ip_attempts: rateLimitResult.ip_attempts,
            email_attempts: rateLimitResult.email_attempts,
          },
          risk_level: "high",
        });

        return {
          error: {
            message:
              "Too many failed login attempts. Please try again in 15 minutes.",
            status: 429,
          },
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Record the login attempt
      await recordLoginAttempt(email, !error);

      // Log additional security events
      if (!error) {
        await logSecurityEvent({
          event_type: "successful_login",
          event_data: { email },
          risk_level: "low",
        });
      } else {
        await logSecurityEvent({
          event_type: "failed_login",
          event_data: {
            email,
            error_message: error.message,
          },
          risk_level: "medium",
        });
      }

      return { error };
    },
    [checkRateLimit, recordLoginAttempt, logSecurityEvent],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      username,
      dateOfBirth,
      sex,
      nationality,
      phone,
    }: SignUpPayload) => {
      let duplicateDetectedDuringPrecheck = false;

      // Pre-signup validation: Check if email already exists. We record the result but
      // still attempt the signup so that false positives in the RPC do not block users.
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc(
          "check_email_exists",
          {
            p_email: email,
          },
        );

        if (checkError) {
          console.error("Error checking email existence:", checkError);
          // Continue with signup if check fails (fallback behavior)
        } else {
          duplicateDetectedDuringPrecheck = emailExists === true;
        }
      } catch (preCheckError) {
        console.error("Pre-signup check failed:", preCheckError);
        // Continue with signup if pre-check fails (fallback behavior)
      }

      const redirectUrl = `${window.location.origin}/dashboard`;

      const metadata: Record<string, string> = {};

      if (username && username.trim().length > 0) {
        metadata.username = username.trim();
      }

      if (dateOfBirth && dateOfBirth.trim().length > 0) {
        metadata.date_of_birth = dateOfBirth.trim();
      }

      if (sex && sex.trim().length > 0) {
        metadata.sex = sex.trim();
      }

      if (nationality && nationality.trim().length > 0) {
        metadata.nationality = nationality.trim();
      }

      if (phone && phone.trim().length > 0) {
        metadata.phone = phone.trim();
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });

      // Enhanced error handling for existing email and other signup issues
      if (error) {
        let errorToReturn = error;
        let errorType = "other";

        // Check for existing user error and provide clear message
        if (
          error.message?.includes("User already registered") ||
          error.message?.includes("already been registered") ||
          error.message?.includes("email address is already registered") ||
          error.status === 422
        ) {
          errorToReturn = {
            message:
              'An account with this email address already exists. Please sign in instead or use the "Forgot Password" option if you need to reset your password.',
          } as any;
          errorType = "existing_email";
        }

        // Check for rate limiting
        else if (
          error.message?.includes("rate") ||
          error.message?.includes("too many")
        ) {
          errorToReturn = {
            message:
              "Too many signup attempts. Please wait a few minutes before trying again.",
          } as any;
          errorType = "rate_limited";
        }

        // Check for weak password
        else if (
          error.message?.includes("password") &&
          error.message?.includes("weak")
        ) {
          errorToReturn = {
            message:
              "Password is too weak. Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
          } as any;
          errorType = "weak_password";
        }

        // Log signup attempt with context on how the duplicate was detected
        await logSecurityEvent({
          event_type:
            errorType === "existing_email"
              ? "blocked_duplicate_signup"
              : "failed_signup",
          event_data: {
            email,
            username,
            date_of_birth: dateOfBirth,
            sex,
            nationality,
            phone,
            error_message: error.message,
            error_type: errorType,
            detection_source:
              errorType === "existing_email"
                ? duplicateDetectedDuringPrecheck
                  ? "precheck"
                  : "supabase"
                : undefined,
          },
          risk_level: errorType === "existing_email" ? "high" : "medium",
        });

        return { error: errorToReturn };
      }

      if (duplicateDetectedDuringPrecheck) {
        await logSecurityEvent({
          event_type: "duplicate_precheck_false_positive",
          event_data: {
            email,
            username,
            date_of_birth: dateOfBirth,
            sex,
            nationality,
            phone,
          },
          risk_level: "low",
        });
      }

      // Log successful signup attempt
      await logSecurityEvent({
        event_type: "successful_signup",
        event_data: {
          email,
          username,
          date_of_birth: dateOfBirth,
          sex,
          nationality,
          phone,
        },
        risk_level: "low",
      });

      // Send welcome email after successful signup
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            email,
            username: username || email.split("@")[0],
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don&apos;t fail the signup if email fails
      }

      return { error };
    },
    [logSecurityEvent],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      // Log password update attempt
      if (!error) {
        await logSecurityEvent({
          event_type: "password_updated",
          user_id: user?.id,
          event_data: {},
          risk_level: "low",
        });
      } else {
        await logSecurityEvent({
          event_type: "failed_password_update",
          user_id: user?.id,
          event_data: {
            error_message: error.message,
          },
          risk_level: "medium",
        });
      }

      return { error };
    },
    [user?.id, logSecurityEvent],
  );

  const signOut = useCallback(async () => {
    if (user) {
      await logSecurityEvent({
        event_type: "user_signout",
        user_id: user.id,
        event_data: {},
        risk_level: "low",
      });
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase sign-out failed:", error);

        if (user) {
          await logSecurityEvent({
            event_type: "failed_signout",
            user_id: user.id,
            event_data: {
              error_message: error.message,
              status: (error as { status?: number }).status,
            },
            risk_level: "medium",
          });
        }

        clearSupabaseAuthStorage();
      }
    } catch (signOutError) {
      console.error("Unexpected error during sign-out:", signOutError);
      clearSupabaseAuthStorage();
    } finally {
      setSession(null);
      setUser(null);
    }
  }, [user, logSecurityEvent]);

  const resetPassword = useCallback(
    async (email: string) => {
      const redirectUrl = `${window.location.origin}/auth?reset=true`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      // Log password reset attempt
      if (!error) {
        await logSecurityEvent({
          event_type: "password_reset_requested",
          event_data: { email },
          risk_level: "low",
        });
      } else {
        await logSecurityEvent({
          event_type: "failed_password_reset",
          event_data: {
            email,
            error_message: error.message,
          },
          risk_level: "medium",
        });
      }

      return { error };
    },
    [logSecurityEvent],
  );

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
