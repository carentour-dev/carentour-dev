"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const HeaderAuthActions = dynamic(
  () => import("@/components/public/HeaderAuthActions"),
  { ssr: false },
);

const SUPABASE_AUTH_STORAGE_KEY_PATTERN = /^sb-[a-z0-9]+-auth-token$/i;

function isSupabaseAuthStorageKey(key: string) {
  return SUPABASE_AUTH_STORAGE_KEY_PATTERN.test(key);
}

function hasStoredSupabaseSession() {
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !isSupabaseAuthStorageKey(key)) {
        continue;
      }

      const value = window.localStorage.getItem(key);
      if (value && value !== "null") {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

type PublicHeaderAuthSlotProps = {
  variant: "desktop" | "mobile";
  signInLabel: string;
};

export default function PublicHeaderAuthSlot({
  variant,
  signInLabel,
}: PublicHeaderAuthSlotProps) {
  const [renderAuthActions, setRenderAuthActions] = useState(false);
  const mobile = variant === "mobile";

  useEffect(() => {
    const syncAuthActions = () => {
      setRenderAuthActions(hasStoredSupabaseSession());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || isSupabaseAuthStorageKey(event.key)) {
        syncAuthActions();
      }
    };

    syncAuthActions();
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (renderAuthActions) {
    return (
      <HeaderAuthActions
        variant={variant}
        mobileCloseBehavior={variant === "mobile" ? "none" : "drawer"}
      />
    );
  }

  return (
    <Link
      href="/auth"
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-sm font-semibold text-muted-foreground transition-all duration-200 ease-smooth hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        mobile ? "h-10 w-full justify-start px-4" : "h-9 px-3",
      )}
    >
      <User className={mobile ? "h-4 w-4" : "h-4 w-4"} />
      {signInLabel}
    </Link>
  );
}
