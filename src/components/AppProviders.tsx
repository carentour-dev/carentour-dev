"use client";

import type { PropsWithChildren } from "react";
import QueryProvider from "@/components/QueryProvider";
import SharedUiProviders from "@/components/SharedUiProviders";
import { AuthProvider } from "@/contexts/AuthContext";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SharedUiProviders>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </SharedUiProviders>
  );
}

export default AppProviders;
