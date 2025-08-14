
import { notFound } from 'next/navigation';
import { getProductById } from '@/services/productService';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getSettings } from '@/app/admin/settings/actions';
import AddToCartButton from './add-to-cart-button';

async function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }
  
  const settings = await getSettings();
  const currencySymbol = await getCurrencySymbol(settings?.currency);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <Card className="overflow-hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {product.imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <Image
                        src={url}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </Card>
        </div>
        
        <div className="flex flex-col">
          <h1 className="text-4xl font-headline font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary mb-6">{currencySymbol}{product.price.toFixed(2)}</p>
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p>{product.description}</p>
          </div>
          <div className="mt-auto pt-6">
            <div className="flex items-center gap-4">
              <AddToCartButton product={product} />
               <p className="text-sm text-muted-foreground">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
