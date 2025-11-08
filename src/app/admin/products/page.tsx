"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Download, Tag, DollarSign, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState, useTransition } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteProduct } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings } from '../settings/actions';
import { bulkUpdateProducts, bulkDeleteProducts } from './bulk-actions';
import { getCategories } from '@/services/categoryService';

type Settings = { currency?: string };

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'price' | 'stock' | 'category' | 'delete' | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');

  const currencySymbol = getCurrencySymbol(settings?.currency);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedProducts, fetchedSettings, fetchedCategories] = await Promise.all([
        getProducts(),
        getSettings(),
        getCategories()
      ]);
      setProducts(fetchedProducts);
      setSettings(fetchedSettings || {});
      setCategories(fetchedCategories);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  }

  const handleConfirmDelete = () => {
    if (!productToDelete) return;

    startTransition(async () => {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        toast({
            title: "Product Deleted",
            description: `${productToDelete.name} has been successfully deleted.`,
        });
      } else {
        toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
        });
      }
      setProductToDelete(null);
    });
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkAction = async () => {
    if (selectedProducts.size === 0 || !bulkAction) return;

    const productIds = Array.from(selectedProducts);

    startTransition(async () => {
      if (bulkAction === 'delete') {
        const result = await bulkDeleteProducts(productIds);
        if (result.success) {
          setProducts(products.filter(p => !selectedProducts.has(p.id)));
          setSelectedProducts(new Set());
          toast({
            title: "Products Deleted",
            description: `${productIds.length} product(s) deleted successfully.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
          });
        }
      } else {
        const updates: any = {};
        if (bulkAction === 'price' && bulkPrice) updates.price = parseFloat(bulkPrice);
        if (bulkAction === 'stock' && bulkStock) updates.stock = parseInt(bulkStock);
        if (bulkAction === 'category' && bulkCategory) updates.category = bulkCategory;

        const result = await bulkUpdateProducts(productIds, updates);
        if (result.success) {
          // Refresh products
          const updatedProducts = await getProducts();
          setProducts(updatedProducts);
          setSelectedProducts(new Set());
          toast({
            title: "Products Updated",
            description: `${productIds.length} product(s) updated successfully.`,
          });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
          });
        }
      }

      setBulkAction(null);
      setBulkPrice('');
      setBulkStock('');
      setBulkCategory('');
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Description'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.category || '',
      p.price.toString(),
      p.stock?.toString() || '0',
      (p.description || '').replace(/,/g, ';')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${products.length} products to CSV.`,
    });
  };

  if (loading) {
    return (
       <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-headline font-bold">Products</h1>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-[50px] w-[50px] rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    )
  }

  return (
    <>
    <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <Dialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'delete' && 'Delete Products'}
              {bulkAction === 'price' && 'Update Price'}
              {bulkAction === 'stock' && 'Update Stock'}
              {bulkAction === 'category' && 'Update Category'}
            </DialogTitle>
            <DialogDescription>
              You have selected {selectedProducts.size} product(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {bulkAction === 'delete' && (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete these {selectedProducts.size} products? This action cannot be undone.
              </p>
            )}

            {bulkAction === 'price' && (
              <div className="space-y-2">
                <Label htmlFor="bulkPrice">New Price ({currencySymbol})</Label>
                <Input
                  id="bulkPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                />
              </div>
            )}

            {bulkAction === 'stock' && (
              <div className="space-y-2">
                <Label htmlFor="bulkStock">New Stock Quantity</Label>
                <Input
                  id="bulkStock"
                  type="number"
                  placeholder="0"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                />
              </div>
            )}

            {bulkAction === 'category' && (
              <div className="space-y-2">
                <Label htmlFor="bulkCategory">New Category</Label>
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger id="bulkCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={isPending || (bulkAction === 'price' && !bulkPrice) || (bulkAction === 'stock' && !bulkStock) || (bulkAction === 'category' && !bulkCategory)}
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
            >
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Products</h1>
          {selectedProducts.size > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedProducts.size} product(s) selected
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <>
              <Button variant="outline" onClick={() => setBulkAction('price')}>
                <DollarSign className="mr-2 h-4 w-4" />
                Update Price
              </Button>
              <Button variant="outline" onClick={() => setBulkAction('stock')}>
                <Package className="mr-2 h-4 w-4" />
                Update Stock
              </Button>
              <Button variant="outline" onClick={() => setBulkAction('category')}>
                <Tag className="mr-2 h-4 w-4" />
                Change Category
              </Button>
              <Button variant="destructive" onClick={() => setBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </>
          )}
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/admin/products/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all products"
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => toggleSelectProduct(product.id)}
                    aria-label={`Select ${product.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Image
                    src={(product.productImages && product.productImages.length > 0 ? product.productImages[0] : product.imageUrls[0])}
                    alt={product.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                    unoptimized
                    data-ai-hint={`${product.category} product`}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{currencySymbol}{product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={product.stock && product.stock < 10 ? 'text-orange-600 font-semibold' : ''}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/edit/${product.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  );
}
