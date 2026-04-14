import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  ip_attempts?: number;
  email_attempts?: number;
}

interface SecurityEventData {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  event_data?: Record<string, any>;
  risk_level?: "low" | "medium" | "high" | "critical";
}

export const useSecurity = () => {
  const [isChecking, setIsChecking] = useState(false);
  const ipAddressPromiseRef = useRef<Promise<string | null> | null>(null);

  const getUserIP = useCallback(async (): Promise<string | null> => {
    if (!ipAddressPromiseRef.current) {
      ipAddressPromiseRef.current = (async () => {
        try {
          // Keep the lookup from stalling auth flows when the IP service is slow.
          const response = await Promise.race([
            fetch("https://api.ipify.org?format=json"),
            new Promise<never>((_, reject) => {
              window.setTimeout(
                () => reject(new Error("IP_LOOKUP_TIMEOUT")),
                1500,
              );
            }),
          ]);
          const data = await response.json();
          return typeof data.ip === "string" ? data.ip : null;
        } catch (error) {
          console.error("Failed to get user IP:", error);
          return null;
        }
      })();
    }

    return ipAddressPromiseRef.current;
  }, []);

  const checkRateLimit = useCallback(
    async (email: string): Promise<RateLimitResult> => {
      setIsChecking(true);
      try {
        const userIP = await getUserIP();

        const { data, error } = await supabase.rpc("check_login_rate_limit", {
          p_ip_address: userIP,
          p_email: email,
        });

        if (error) {
          console.error("Rate limit check failed:", error);
          return { allowed: true }; // Allow on error to prevent blocking legitimate users
        }

        return data ? (data as unknown as RateLimitResult) : { allowed: true };
      } catch (error) {
        console.error("Rate limit check error:", error);
        return { allowed: true }; // Allow on error
      } finally {
        setIsChecking(false);
      }
    },
    [getUserIP],
  );

  const recordLoginAttempt = useCallback(
    async (email: string, success: boolean): Promise<void> => {
      try {
        const userIP = await getUserIP();

        await supabase.rpc("record_login_attempt", {
          p_ip_address: userIP,
          p_email: email,
          p_success: success,
        });
      } catch (error) {
        console.error("Failed to record login attempt:", error);
        // Don't throw - this shouldn't block the login process
      }
    },
    [getUserIP],
  );

  const logSecurityEvent = useCallback(
    async (eventData: SecurityEventData): Promise<void> => {
      try {
        const userIP = await getUserIP();
        const userAgent = navigator.userAgent;

        await supabase.rpc("log_security_event", {
          p_event_type: eventData.event_type,
          p_user_id: eventData.user_id,
          p_ip_address: userIP,
          p_user_agent: userAgent,
          p_event_data: eventData.event_data || {},
          p_risk_level: eventData.risk_level || "low",
        });
      } catch (error) {
        console.error("Failed to log security event:", error);
        // Don't throw - this shouldn't block normal operations
      }
    },
    [getUserIP],
  );

  return {
    checkRateLimit,
    recordLoginAttempt,
    logSecurityEvent,
    isChecking,
  };
};
