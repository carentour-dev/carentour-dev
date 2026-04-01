import type { PublicLocale } from "@/i18n/routing";
import { localizeDigits } from "@/lib/public/numbers";

export const PUBLIC_CONTACT_PHONE_DISPLAY = "+20 122 9503333";
export const PUBLIC_CONTACT_PHONE_HREF = "tel:+201229503333";
export const PUBLIC_CONTACT_EMAIL = "info@carentour.com";
export const PUBLIC_CONTACT_EMAIL_HREF = "mailto:info@carentour.com";
export const PUBLIC_CONTACT_ADDRESS_DISPLAY =
  "Office 23, Building D, Agora Mall, New Cairo, Egypt";
export const PUBLIC_CONTACT_ADDRESS_DISPLAY_AR =
  "مكتب 23، المبنى D، أغورا مول، القاهرة الجديدة، مصر";

export function formatPhoneNumberForDisplay(
  phoneNumber: string,
  locale: PublicLocale,
) {
  return localizeDigits(phoneNumber, locale);
}

export function getPhoneNumberDisplayDirection(locale: PublicLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getPublicContactAddressDisplay(locale: PublicLocale) {
  return localizeDigits(
    locale === "ar"
      ? PUBLIC_CONTACT_ADDRESS_DISPLAY_AR
      : PUBLIC_CONTACT_ADDRESS_DISPLAY,
    locale,
  );
}
