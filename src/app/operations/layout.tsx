import type { ReactNode } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";

export default function OperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OperationsShell>{children}</OperationsShell>;
}
