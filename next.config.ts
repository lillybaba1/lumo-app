
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
        hostname: new URL(firebaseConfig.storageBucket).hostname,
      }
    ],
  },
};

export default nextConfig;
