const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "G-RYJ3Q9HMVQ";
const isProduction = process.env.NODE_ENV === "production";

export default function GoogleTag() {
  if (!isProduction || !googleTagId) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
      />
      <script
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
  );
}
