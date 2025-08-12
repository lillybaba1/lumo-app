
import ProductCard from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTheme } from '@/app/admin/appearance/actions';
import { getProducts, getCategories } from '@/services/productService';
import { seedInitialData } from '@/lib/seed';
import Hero3D from '@/components/hero-3d';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
  foregroundImageScale: 100,
  foregroundImagePositionX: 50,
  foregroundImagePositionY: 50,
};

export default async function Home() {
  await seedInitialData();
  const theme = await getTheme() ?? defaultTheme;
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Hero3D theme={theme} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex flex-wrap h-auto justify-center max-w-4xl mx-auto mb-8">
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
