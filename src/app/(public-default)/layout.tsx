import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppProviders from "@/components/AppProviders";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import WhatsAppCtaGate from "@/components/WhatsAppCtaGate";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { PublicShellProvider } from "@/components/public/PublicShellContext";
import { defaultPublicLocale } from "@/i18n/routing";
import { isNavigationVisible } from "@/lib/navigation";
import { getPublicDirection } from "@/lib/public/routing";
import { loadPublicNavigationLinks } from "@/server/navigation";

export default async function DefaultPublicLayout({
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
        <PublicShellProvider>
          <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
            <MicrosoftClarity />
            <div
              lang={defaultPublicLocale}
              dir={getPublicDirection(defaultPublicLocale)}
              className="flex min-h-screen flex-col"
            >
              <Header forceRender />
              <main className="flex-1">{children}</main>
              <Footer forceRender />
            </div>
            <WhatsAppCtaGate />
          </NavigationProvider>
        </PublicShellProvider>
      </NextIntlClientProvider>
    </AppProviders>
  );
}
