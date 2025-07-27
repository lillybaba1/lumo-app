import { products, categories } from '@/lib/mock-data';
import ProductCard from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTheme } from '@/app/admin/appearance/actions';
import Image from 'next/image';

export default async function Home() {
  const theme = await getTheme();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="relative w-full min-h-[60vh] flex items-center justify-center text-center text-white overflow-hidden">
          {theme.backgroundImage ? (
            <Image
              src={theme.backgroundImage}
              alt="Background"
              layout="fill"
              objectFit="cover"
              className="z-0"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 z-0"></div>
          )}
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight">Discover Your Style</h1>
              <p className="mt-6 text-lg md:text-xl max-w-2xl">Browse our curated collection of the latest trends in fashion, electronics, beauty, and more.</p>
            </div>
            <div className="flex justify-center">
              {theme.foregroundImage && (
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <Image
                    src={theme.foregroundImage}
                    alt="Featured Product"
                    layout="fill"
                    objectFit="contain"
                    className="drop-shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 mx-auto max-w-4xl mb-8">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
                ))}
            </TabsList>
            
            <TabsContent value="all">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
                </div>
            </TabsContent>

            {categories.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.filter(p => p.category === category.name).map((product) => (
                    <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                </TabsContent>
            ))}
            </Tabs>
        </div>
      </main>
    </div>
  );
}
