/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lovable.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cmnwwchipysvwvijqjcu.supabase.co',
        pathname: '/storage/v1/object/public/media/**',
      },
    ],
  },
  // Exclude old React Router pages directory from compilation
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => `app.${ext}`).concat(['tsx', 'ts', 'jsx', 'js']),
  webpack: (config, { isServer }) => {
    // Ignore the old pages directory
    config.module.rules.push({
      test: /src\/pages\/.*/,
      loader: 'ignore-loader',
    });
    return config;
  },
}

export default nextConfig;
