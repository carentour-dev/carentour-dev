import type { Metadata } from "next";
import "../index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import { AuthProvider } from "@/contexts/AuthContext";
import QueryProvider from "@/components/QueryProvider";
import WhatsAppCtaGate from "@/components/WhatsAppCtaGate";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { loadPublicNavigationLinks } from "@/server/navigation";
import { isNavigationVisible } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Care N Tour | World-Class Medical Care in Egypt",
  description:
    "Experience premium medical treatments in Egypt with significant cost savings. World-class service providers, certified specialists, and comprehensive medical tourism services.",
  keywords:
    "medical tourism, Egypt healthcare, medical procedures, cosmetic surgery, cardiac surgery, dental care, LASIK, affordable healthcare",
  authors: [{ name: "Care N Tour" }],
  openGraph: {
    title: "Care N Tour | World-Class Medical Care",
    description:
      "Experience premium medical treatments in Egypt with significant cost savings. World-class service providers and certified specialists.",
    type: "website",
    images: [{ url: "https://www.carentour.com/hero-medical-facility.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@carentour",
    images: ["https://www.carentour.com/hero-medical-facility.jpg"],
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navigationResult = await loadPublicNavigationLinks();
  const initialNavigationLinks =
    navigationResult.links.filter(isNavigationVisible);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <MicrosoftClarity />
        <ThemeProvider defaultTheme="system" storageKey="care-n-tour-theme">
          <NavigationProvider initialNavigationLinks={initialNavigationLinks}>
            <QueryProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  {children}
                  <WhatsAppCtaGate />
                </TooltipProvider>
              </AuthProvider>
            </QueryProvider>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
