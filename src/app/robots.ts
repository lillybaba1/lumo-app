import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/business/',
          '/api/',
          '/account/',
          '/checkout/',
          '/orders/',
        ],
      },
    ],
    sitemap: 'https://julazone.com/sitemap.xml',
  };
}
