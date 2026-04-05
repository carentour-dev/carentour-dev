import type { Metadata } from "next";
import Script from "next/script";
import DocumentRootAttributes from "@/components/public/DocumentRootAttributes";
import "../index.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "G-RYJ3Q9HMVQ";
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {isProduction ? (
          <>
            <Script
              id="google-tag-script"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="beforeInteractive"
            />
            <Script
              id="google-tag-init"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${googleTagId}');
                `,
              }}
            />
          </>
        ) : null}
        <DocumentRootAttributes />
        {children}
      </body>
    </html>
  );
}
