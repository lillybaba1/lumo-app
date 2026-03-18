import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getProductsBySeller } from "@/services/productService";

export const dynamic = 'force-dynamic';

export default async function BusinessProductsPage() {
  const { user, businessAccount } = await requireBusiness();

  // Fetch seller's products only
  const products = await getProductsBySeller(businessAccount.id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">My Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog
          </p>
        </div>
        <Link href="/business/products/add">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Start selling by adding your first product to the marketplace
            </p>
            <Link href="/business/products/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                  <Image
                    src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock} units
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/business/products/edit/${product.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
