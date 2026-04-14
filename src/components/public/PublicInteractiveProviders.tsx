"use client";

import type { PropsWithChildren } from "react";
import QueryProvider from "@/components/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export function PublicAuthBoundary({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function PublicQueryBoundary({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>;
}

export function PublicAuthQueryBoundary({ children }: PropsWithChildren) {
  return (
    <PublicQueryBoundary>
      <PublicAuthBoundary>{children}</PublicAuthBoundary>
    </PublicQueryBoundary>
  );
}
