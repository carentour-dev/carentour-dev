import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase media can be user-managed and occasionally point at removed objects.
    // Use direct image URLs to avoid optimizer upstream failures during runtime.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.carentour.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cmnwwchipysvwvijqjcu.supabase.co",
        pathname: "/storage/v1/object/public/media/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
