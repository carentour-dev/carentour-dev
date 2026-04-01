import type { NavigationQueryResult } from "@/lib/navigation";
import { type PublicLocale } from "@/i18n/routing";
import { getLocalizedNavigationLinks } from "@/lib/public/localization";
import { unstable_noStore as noStore } from "next/cache";

export async function loadPublicNavigationLinks(
  locale: PublicLocale,
): Promise<NavigationQueryResult> {
  // Navigation updates (like hiding/showing links) should appear immediately.
  // Disable Next.js fetch caching so we always render with fresh data.
  noStore();
  return getLocalizedNavigationLinks(locale);
}
