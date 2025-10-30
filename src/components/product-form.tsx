
"use client";

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Upload, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProduct } from '@/app/admin/products/actions';
import { uploadImageAndGetUrl } from '@/services/storageService';
import { Product, Category } from '@/lib/types';
import { useRouter } from 'next/navigation';

type ProductFormProps = {
    product?: Product | null;
    categories: Category[];
};

function SubmitButton({ isSaving }: { isSaving?: boolean }) {
    const { pending } = useFormStatus();
    const isDisabled = pending || isSaving;
    return (
        <Button type="submit" disabled={isDisabled}>
            {isDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isDisabled ? 'Saving...' : 'Save Product'}
        </Button>
    );
}

export default function ProductForm({ product = null, categories }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [imageUrls, setImageUrls] = React.useState<string[]>(product?.imageUrls || []);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            console.log('[Product Form] No files selected');
            return;
        }

        console.log('[Product Form] Starting upload for', files.length, 'file(s)');
        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                if (file.size > 4 * 1024 * 1024) {
                    console.warn('[Product Form] File too large:', file.name);
                    toast({
                        title: `Image "${file.name}" too large`,
                        description: "Please upload images smaller than 4MB.",
                        variant: "destructive"
                    });
                    return null;
                }

                console.log(`[Product Form] Uploading file ${index + 1}/${files.length}:`, file.name);
                try {
                    const url = await uploadImageAndGetUrl(file, `products/${Date.now()}-${file.name}`);
                    console.log(`[Product Form] Upload ${index + 1} successful:`, url);
                    return url;
                } catch (err) {
                    console.error(`[Product Form] Upload ${index + 1} failed:`, err);
                    throw err;
                }
            });

            const urls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

            console.log('[Product Form] All uploads complete. URLs:', urls);

            if (urls.length > 0) {
                setImageUrls(prev => {
                    const newUrls = [...prev, ...urls];
                    console.log('[Product Form] Updated image URLs:', newUrls);
                    return newUrls;
                });
                toast({
                    title: 'Upload successful',
                    description: `${urls.length} image(s) uploaded successfully.`,
                });
            } else {
                console.warn('[Product Form] No images were successfully uploaded');
                toast({
                    title: 'Upload failed',
                    description: 'No images could be uploaded. Please try again.',
                    variant: 'destructive'
                });
            }

        } catch (error: any) {
            console.error('[Product Form] Image upload error:', error);
            toast({
                title: 'Upload failed',
                description: error.message || 'Could not upload images. Please check console for details.',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };
    
    const handleRemoveImage = (urlToRemove: string) => {
        setImageUrls(prev => prev.filter(url => url !== urlToRemove));
    }

    const handleSubmit = async (formData: FormData) => {
        // Client-side validation: Check if at least one image is uploaded
        if (imageUrls.length === 0) {
            toast({
                title: 'Image Required',
                description: 'Please upload at least one product image before saving.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            const result = await saveProduct(formData);

            if (result && !result.success) {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to save product',
                    variant: 'destructive',
                });
                setIsSaving(false);
            } else {
                toast({
                    title: 'Success',
                    description: product ? 'Product updated successfully' : 'Product created successfully',
                });
                // Redirect will happen from server action
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
            setIsSaving(false);
        }
    }

    return (
        <form action={handleSubmit}>
            {product && <input type="hidden" name="id" value={product.id} />}
            <input type="hidden" name="imageUrls" value={imageUrls.join(',')} />

            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" defaultValue={product?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={product?.category} required>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={product?.description} required rows={5} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="number" defaultValue={product?.stock} required />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label>Product Images *</Label>
                        <p className="text-sm text-muted-foreground">At least one image is required. Upload multiple images to showcase your product.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="product-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" type="button" disabled={isUploading}>
                                <div>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? 'Uploading...' : 'Upload Images'}
                                </div>
                            </Button>
                            <input id="product-image-upload" ref={imageInputRef} type="file" className="sr-only" accept="image/*" onChange={handleImageChange} multiple />
                        </label>
                        {imageUrls.length > 0 && (
                            <span className="text-sm text-muted-foreground">{imageUrls.length} image(s) uploaded</span>
                        )}
                    </div>
                     {imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {imageUrls.map(url => (
                                <div key={url} className="relative w-full aspect-square rounded-md overflow-hidden border">
                                    <Image src={url} alt="Product Preview" fill className="object-cover" unoptimized/>
                                    <Button variant="destructive" size="icon" type="button" className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-destructive/80 text-white" onClick={() => handleRemoveImage(url)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {imageUrls.length === 0 && (
                         <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50" data-ai-hint="product image placeholder">
                            {isUploading ? <Loader2 className="animate-spin" /> : <span className="text-xs text-muted-foreground">No Images Uploaded</span>}
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                <SubmitButton isSaving={isSaving} />
            </CardFooter>
        </form>
    );
}
