
import type {NextConfig} from 'next';
import { firebaseConfig } from './src/lib/firebaseConfig';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: `/**`,
      },
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    // Only add this rule for the edge runtime
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
