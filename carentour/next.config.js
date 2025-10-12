/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "www.carentour.com"],
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

export default nextConfig;
