"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import QueryProvider from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

const CHUNK_RELOAD_KEY = "carentour:chunk-reload-meta";

const isChunkLoadError = (value: unknown) => {
  const text = typeof value === "string" ? value : "";
  return (
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("/_next/static/chunks/")
  );
};

function ChunkLoadRecovery() {
  useEffect(() => {
    const maybeRecover = () => {
      const now = Date.now();
      const raw = window.sessionStorage.getItem(CHUNK_RELOAD_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const previousCount =
        parsed && typeof parsed.count === "number" ? parsed.count : 0;
      const previousAt =
        parsed && typeof parsed.lastAttemptAt === "number"
          ? parsed.lastAttemptAt
          : 0;
      const withinCooldown = now - previousAt < 8000;
      const reachedRetryCap = previousCount >= 2;
      const shouldSkip = withinCooldown || reachedRetryCap;

      if (shouldSkip) {
        return;
      }

      window.sessionStorage.setItem(
        CHUNK_RELOAD_KEY,
        JSON.stringify({
          count: previousCount + 1,
          lastAttemptAt: now,
        }),
      );
      window.location.reload();
    };

    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message ?? "";
      const filename = event.filename ?? "";
      if (isChunkLoadError(message) || isChunkLoadError(filename)) {
        maybeRecover();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === "string"
            ? event.reason
            : "";
      if (isChunkLoadError(reason)) {
        maybeRecover();
      }
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="care-n-tour-theme">
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <ChunkLoadRecovery />
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
