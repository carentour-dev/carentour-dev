import type { PublicLocale } from "@/i18n/routing";
import { localizeDigits } from "@/lib/public/numbers";

export const PUBLIC_CONTACT_PHONE_DISPLAY = "+20 122 9503333";
export const PUBLIC_CONTACT_PHONE_HREF = "tel:+201229503333";
export const PUBLIC_CONTACT_EMAIL = "info@carentour.com";
export const PUBLIC_CONTACT_EMAIL_HREF = "mailto:info@carentour.com";

export function formatPhoneNumberForDisplay(
  phoneNumber: string,
  locale: PublicLocale,
) {
  return localizeDigits(phoneNumber, locale);
}
