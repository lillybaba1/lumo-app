import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://julazone.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/boutiques`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: 'always', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (products) {
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Sitemap: Error fetching products', error);
  }

  // Dynamic boutique pages
  let boutiquePages: MetadataRoute.Sitemap = [];
  try {
    const { data: boutiques } = await supabaseAdmin
      .from('boutiques')
      .select('slug, updated_at')
      .eq('is_published', true)
      .limit(1000);

    if (boutiques) {
      boutiquePages = boutiques.map((boutique) => ({
        url: `${baseUrl}/boutique/${boutique.slug}`,
        lastModified: new Date(boutique.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Sitemap: Error fetching boutiques', error);
  }

  return [...staticPages, ...productPages, ...boutiquePages];
}
