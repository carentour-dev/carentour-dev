"use client";

import { usePathname } from "next/navigation";
import WhatsAppWidget, {
  type WhatsAppWidgetProps,
} from "@/components/WhatsAppWidget";

const HIDDEN_PREFIXES = ["/admin", "/operations", "/cms"];

export default function WhatsAppWidgetGate(props: WhatsAppWidgetProps) {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return <WhatsAppWidget {...props} />;
}
