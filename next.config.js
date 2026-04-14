import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // CMS media URLs are versioned, so optimizer responses can be cached aggressively.
    minimumCacheTTL: 60 * 60 * 24 * 365,
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
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cmnwwchipysvwvijqjcu.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
