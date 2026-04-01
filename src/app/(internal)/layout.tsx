import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import AppProviders from "@/components/AppProviders";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { defaultPublicLocale } from "@/i18n/routing";
import { isNavigationVisible } from "@/lib/navigation";
import { loadPublicNavigationLinks } from "@/server/navigation";

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.png",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default async function InternalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  setRequestLocale(defaultPublicLocale);

  const [messages, navigationResult] = await Promise.all([
    getMessages(),
    loadPublicNavigationLinks(defaultPublicLocale),
  ]);
  const initialNavigationLinks =
    navigationResult.links.filter(isNavigationVisible);

  return (
    <AppProviders>
      <NextIntlClientProvider locale={defaultPublicLocale} messages={messages}>
        <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
          {children}
        </NavigationProvider>
      </NextIntlClientProvider>
    </AppProviders>
  );
}
