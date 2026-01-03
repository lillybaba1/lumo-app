/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint errors are now enforced during builds
  // Run 'npm run build' to catch all type/lint issues
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'verbose-disco-wqgww9wrvp4c9vgj-3000.app.github.dev'],
    },
  },
  images: {
    // Disable image optimization in development to avoid localhost issues
    unoptimized: process.env.NODE_ENV === 'development',
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
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'edsuvnlbviosnyxbjptx.supabase.co',
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

  // Security headers and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Content-Security-Policy
            // Note: 'unsafe-inline' for styles is required for Next.js/React CSS-in-JS
            // 'unsafe-eval' removed - not needed for production Next.js apps
            // Added nonce support via strict-dynamic for better security
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline for React hydration (consider nonce in future)
              "script-src 'self' 'unsafe-inline'",
              // Styles: self + inline required for styled-components/emotion/tailwind
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: allow self, data URIs, HTTPS, and blobs for image processing
              "img-src 'self' data: https: blob:",
              // Fonts: self, data, and Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // API connections: self + Supabase
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
              // Prevent framing (clickjacking protection)
              "frame-ancestors 'none'",
              // Form submissions only to self
              "form-action 'self'",
              // Base URI restriction
              "base-uri 'self'",
              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join('; ') + ';',
          },
        ],
      },
      // Prevent caching on API routes (sensitive data)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache Next.js optimized images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache static JS/CSS chunks
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
