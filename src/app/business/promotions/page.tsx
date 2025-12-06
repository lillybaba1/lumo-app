import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Zap, Package, Plus } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CouponsTab from "./coupons-tab";
import FlashSalesTab from "./flash-sales-tab";
import BundlesTab from "./bundles-tab";

export const dynamic = 'force-dynamic';

async function getSellerPromotions(sellerId: string) {
  try {
    // Get seller's products for the product selector
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price, status')
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .order('name');

    // Get coupons
    const { data: coupons } = await supabaseAdmin
      .from('seller_coupons')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Get flash sales
    const { data: flashSales } = await supabaseAdmin
      .from('flash_sales')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Get bundle deals
    const { data: bundles } = await supabaseAdmin
      .from('bundle_deals')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    return {
      products: products || [],
      coupons: coupons || [],
      flashSales: flashSales || [],
      bundles: bundles || [],
    };
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return {
      products: [],
      coupons: [],
      flashSales: [],
      bundles: [],
    };
  }
}

export default async function BusinessPromotionsPage() {
  const { user, businessAccount } = await requireBusiness();
  const data = await getSellerPromotions(businessAccount.id);

  // Count active promotions
  const activeCoupons = data.coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())).length;
  const activeFlashSales = data.flashSales.filter(s => s.is_active && new Date(s.ends_at) > new Date()).length;
  const activeBundles = data.bundles.filter(b => b.is_active).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" />
          Promotions
        </h1>
        <p className="text-muted-foreground mt-1">
          Create coupons, flash sales, and bundle deals to boost your sales
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Coupons</p>
                <p className="text-2xl font-bold">{activeCoupons}</p>
              </div>
              <Tag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Flash Sales</p>
                <p className="text-2xl font-bold">{activeFlashSales}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Bundle Deals</p>
                <p className="text-2xl font-bold">{activeBundles}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="coupons">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="flash-sales" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Flash Sales
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bundles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="mt-6">
          <CouponsTab 
            coupons={data.coupons} 
            products={data.products}
            sellerId={businessAccount.id}
          />
        </TabsContent>

        <TabsContent value="flash-sales" className="mt-6">
          <FlashSalesTab 
            flashSales={data.flashSales}
            products={data.products}
            sellerId={businessAccount.id}
          />
        </TabsContent>

        <TabsContent value="bundles" className="mt-6">
          <BundlesTab 
            bundles={data.bundles}
            products={data.products}
            sellerId={businessAccount.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
