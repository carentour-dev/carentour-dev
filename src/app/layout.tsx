import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import QueryProvider from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Care N Tour | World-Class Medical Care in Egypt",
  description: "Experience premium medical treatments in Egypt with significant cost savings. World-class service providers, certified specialists, and comprehensive medical tourism services.",
  keywords: "medical tourism, Egypt healthcare, medical procedures, cosmetic surgery, cardiac surgery, dental care, LASIK, affordable healthcare",
  authors: [{ name: "Care N Tour" }],
  openGraph: {
    title: "Care N Tour | World-Class Medical Care",
    description: "Experience premium medical treatments in Egypt with significant cost savings. World-class service providers and certified specialists.",
    type: "website",
    images: [{ url: "https://lovable.dev/opengraph-image-p98pqg.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lovable_dev",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="care-n-tour-theme">
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
