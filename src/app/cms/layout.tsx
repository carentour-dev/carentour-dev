import type { Metadata } from "next";
import type { ReactNode } from "react";
import CmsLayoutClient from "./CmsLayoutClient";

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

export default function CmsLayout({ children }: { children: ReactNode }) {
  return <CmsLayoutClient>{children}</CmsLayoutClient>;
}
