import Script from "next/script";

const DEFAULT_GOOGLE_TAG_ID = "G-RYJ3Q9HMVQ";

export default function GoogleTagManager() {
  const googleTagId =
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? DEFAULT_GOOGLE_TAG_ID;
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction || !googleTagId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-tag-bootstrap"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${googleTagId.replace(/"/g, '\\"')}");`,
        }}
      />
      <Script
        id="google-tag-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`}
        strategy="lazyOnload"
      />
    </>
  );
}
