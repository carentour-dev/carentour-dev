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
  // Exclude old React Router pages directory from compilation
  pageExtensions: ["tsx", "ts", "jsx", "js"]
    .map((ext) => `app.${ext}`)
    .concat(["tsx", "ts", "jsx", "js"]),
  webpack: (config, { isServer }) => {
    // Ignore the old pages directory
    config.module.rules.push({
      test: /src\/pages\/.*/,
      loader: "ignore-loader",
    });
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
