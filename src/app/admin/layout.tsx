"use client";

import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Wrap every admin route with the shared navigation shell.
  return <AdminShell>{children}</AdminShell>;
}
