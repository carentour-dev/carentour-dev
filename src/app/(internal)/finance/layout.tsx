import type { Metadata } from "next";
import type { ReactNode } from "react";
import FinanceLayoutClient from "./FinanceLayoutClient";

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

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <FinanceLayoutClient>{children}</FinanceLayoutClient>;
}
