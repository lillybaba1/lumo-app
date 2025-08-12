
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
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState, useTransition } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteProduct } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getSettings } from '../settings/actions';

type Settings = { currency?: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  const currencySymbol = settings.currency ? (new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).formatToParts(1).find(p => p.type === 'currency')?.value || '$') : '$';

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedProducts, fetchedSettings] = await Promise.all([
        getProducts(),
        getSettings()
      ]);
      setProducts(fetchedProducts);
      setSettings(fetchedSettings || {});
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

    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Products</h1>
        <Button asChild>
            <Link href="/admin/products/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
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
                  <Image
                    src={product.imageUrl}
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
                <TableCell>{product.stock}</TableCell>
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
