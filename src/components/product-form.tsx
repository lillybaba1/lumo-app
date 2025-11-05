
"use client";

import * as React from 'react';
import { useFormStatus, useFormState } from 'react-dom';
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

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {pending ? 'Saving...' : 'Save Product'}
        </Button>
    );
}

const initialState = { success: false, message: '' };

export default function ProductForm({ product = null, categories }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [state, formAction] = useFormState(saveProduct, initialState);
    const [imageUrls, setImageUrls] = React.useState<string[]>(product?.imageUrls || []);
    const [isUploading, setIsUploading] = React.useState(false);
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success',
                description: product ? 'Product updated successfully' : 'Product created successfully',
            });
            router.push('/admin/products');
        } else if (state.message) {
            toast({
                title: 'Error',
                description: state.message,
                variant: 'destructive',
            });
        }
    }, [state, product, router, toast]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => {
                if (file.size > 4 * 1024 * 1024) {
                    toast({ title: `Image "${file.name}" too large`, description: "Max 4MB.", variant: "destructive" });
                    return null;
                }
                return uploadImageAndGetUrl(file, `products/${Date.now()}-${file.name}`);
            });

            const urls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

            if (urls.length > 0) {
                setImageUrls(prev => [...prev, ...urls]);
                toast({ title: 'Upload successful', description: `${urls.length} image(s) added.` });
            }
        } catch (error: any) {
            toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
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
    
    const handleSubmit = (formData: FormData) => {
        if (imageUrls.length === 0) {
            toast({ title: 'Image Required', description: 'Please upload at least one image.', variant: 'destructive' });
            return;
        }
        formAction(formData);
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
                        <p className="text-sm text-muted-foreground">At least one image is required. Upload multiple images.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="product-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" type="button" disabled={isUploading}>
                                <div>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
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
                         <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                            {isUploading ? <Loader2 className="animate-spin" /> : <span className="text-xs text-muted-foreground">No Images Uploaded</span>}
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <SubmitButton />
            </CardFooter>
        </form>
    );
}
