import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppProviders from "@/components/AppProviders";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import WhatsAppCtaGate from "@/components/WhatsAppCtaGate";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { PublicShellProvider } from "@/components/public/PublicShellContext";
import { isNavigationVisible } from "@/lib/navigation";
import { validatePublicLocale } from "@/lib/public/localization";
import { publicLocales, type PublicLocale } from "@/i18n/routing";
import { getPublicDirection } from "@/lib/public/routing";
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

export function generateStaticParams() {
  return publicLocales.map((locale) => ({ locale }));
}

export default async function PublicLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  validatePublicLocale(rawLocale);
  const locale = rawLocale as PublicLocale;

  setRequestLocale(locale);

  const [messages, navigationResult] = await Promise.all([
    getMessages(),
    loadPublicNavigationLinks(locale),
  ]);
  const initialNavigationLinks =
    navigationResult.links.filter(isNavigationVisible);

  return (
    <AppProviders>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <PublicShellProvider>
          <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
            <MicrosoftClarity />
            <div
              lang={locale}
              dir={getPublicDirection(locale)}
              className="flex min-h-screen flex-col"
            >
              <Header forceRender />
              <div className="flex-1">{children}</div>
              <Footer forceRender />
            </div>
            <WhatsAppCtaGate />
          </NavigationProvider>
        </PublicShellProvider>
      </NextIntlClientProvider>
    </AppProviders>
  );
}
