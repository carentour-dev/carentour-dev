import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function OperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OperationsShell>{children}</OperationsShell>;
}
