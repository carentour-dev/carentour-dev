"use client";

import { usePathname } from "next/navigation";
import WhatsAppCta, { type WhatsAppCtaProps } from "./WhatsAppCta";

const HIDDEN_PREFIXES = ["/admin", "/operations", "/cms"];

export default function WhatsAppCtaGate(props: WhatsAppCtaProps) {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return <WhatsAppCta {...props} />;
}
