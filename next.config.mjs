/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'verbose-disco-wqgww9wrvp4c9vgj-3000.app.github.dev'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
      });
    }
    return config;
  },
};

export default nextConfig;
