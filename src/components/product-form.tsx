
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
    const [productImages, setProductImages] = React.useState<string[]>(product?.productImages || []);
    const [foregroundImages, setForegroundImages] = React.useState<string[]>(product?.foregroundImages || []);
    const [backgroundImages, setBackgroundImages] = React.useState<string[]>(product?.backgroundImages || []);
    const [isUploading, setIsUploading] = React.useState<{ product: boolean; foreground: boolean; background: boolean }>({
        product: false,
        foreground: false,
        background: false
    });
    const productImageInputRef = React.useRef<HTMLInputElement>(null);
    const foregroundImageInputRef = React.useRef<HTMLInputElement>(null);
    const backgroundImageInputRef = React.useRef<HTMLInputElement>(null);

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

    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'product' | 'foreground' | 'background',
        folder: string
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(prev => ({ ...prev, [type]: true }));
        try {
            const uploadPromises = Array.from(files).map(file => {
                if (file.size > 4 * 1024 * 1024) {
                    toast({ title: `Image "${file.name}" too large`, description: "Max 4MB.", variant: "destructive" });
                    return null;
                }
                return uploadImageAndGetUrl(file, `${folder}/${Date.now()}-${file.name}`);
            });

            const urls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

            if (urls.length > 0) {
                if (type === 'product') {
                    setProductImages(prev => [...prev, ...urls]);
                } else if (type === 'foreground') {
                    setForegroundImages(prev => [...prev, ...urls]);
                } else if (type === 'background') {
                    setBackgroundImages(prev => [...prev, ...urls]);
                }
                toast({ title: 'Upload successful', description: `${urls.length} ${type} image(s) added.` });
            }
        } catch (error: any) {
            toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(prev => ({ ...prev, [type]: false }));
            const inputRef = type === 'product' ? productImageInputRef : type === 'foreground' ? foregroundImageInputRef : backgroundImageInputRef;
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = (urlToRemove: string, type: 'product' | 'foreground' | 'background') => {
        if (type === 'product') {
            setProductImages(prev => prev.filter(url => url !== urlToRemove));
        } else if (type === 'foreground') {
            setForegroundImages(prev => prev.filter(url => url !== urlToRemove));
        } else if (type === 'background') {
            setBackgroundImages(prev => prev.filter(url => url !== urlToRemove));
        }
    }

    const handleSubmit = (formData: FormData) => {
        if (productImages.length === 0 && imageUrls.length === 0) {
            toast({ title: 'Image Required', description: 'Please upload at least one product image.', variant: 'destructive' });
            return;
        }
        formAction(formData);
    }

    return (
        <form action={handleSubmit}>
            {product && <input type="hidden" name="id" value={product.id} />}
            <input type="hidden" name="imageUrls" value={imageUrls.join(',')} />
            <input type="hidden" name="productImages" value={productImages.join(',')} />
            <input type="hidden" name="foregroundImages" value={foregroundImages.join(',')} />
            <input type="hidden" name="backgroundImages" value={backgroundImages.join(',')} />

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

                {/* Product Images Section */}
                <div className="space-y-4">
                    <div>
                        <Label>Product Images *</Label>
                        <p className="text-sm text-muted-foreground">Main product photos shown in carousel. At least one required.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="product-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" type="button" disabled={isUploading.product}>
                                <div>
                                    {isUploading.product ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading.product ? 'Uploading...' : 'Upload Product Images'}
                                </div>
                            </Button>
                            <input
                                id="product-image-upload"
                                ref={productImageInputRef}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'product', 'products')}
                                multiple
                            />
                        </label>
                        {productImages.length > 0 && (
                            <span className="text-sm text-muted-foreground">{productImages.length} image(s) uploaded</span>
                        )}
                    </div>
                    {productImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {productImages.map(url => (
                                <div key={url} className="relative w-full aspect-square rounded-md overflow-hidden border">
                                    <Image src={url} alt="Product" fill className="object-cover" unoptimized/>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        type="button"
                                        className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-destructive/80 text-white"
                                        onClick={() => handleRemoveImage(url, 'product')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {productImages.length === 0 && (
                        <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                            {isUploading.product ? <Loader2 className="animate-spin" /> : <span className="text-xs text-muted-foreground">No Product Images</span>}
                        </div>
                    )}
                </div>

                {/* Foreground Images Section */}
                <div className="space-y-4">
                    <div>
                        <Label>Foreground Images</Label>
                        <p className="text-sm text-muted-foreground">Foreground elements for admin/editing purposes (optional).</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="foreground-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" type="button" disabled={isUploading.foreground}>
                                <div>
                                    {isUploading.foreground ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading.foreground ? 'Uploading...' : 'Upload Foreground Images'}
                                </div>
                            </Button>
                            <input
                                id="foreground-image-upload"
                                ref={foregroundImageInputRef}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'foreground', 'foreground')}
                                multiple
                            />
                        </label>
                        {foregroundImages.length > 0 && (
                            <span className="text-sm text-muted-foreground">{foregroundImages.length} image(s) uploaded</span>
                        )}
                    </div>
                    {foregroundImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {foregroundImages.map(url => (
                                <div key={url} className="relative w-full aspect-square rounded-md overflow-hidden border">
                                    <Image src={url} alt="Foreground" fill className="object-cover" unoptimized/>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        type="button"
                                        className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-destructive/80 text-white"
                                        onClick={() => handleRemoveImage(url, 'foreground')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {foregroundImages.length === 0 && (
                        <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                            {isUploading.foreground ? <Loader2 className="animate-spin" /> : <span className="text-xs text-muted-foreground">No Foreground Images</span>}
                        </div>
                    )}
                </div>

                {/* Background Images Section */}
                <div className="space-y-4">
                    <div>
                        <Label>Background Images</Label>
                        <p className="text-sm text-muted-foreground">Background elements for admin/editing purposes (optional).</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="background-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" type="button" disabled={isUploading.background}>
                                <div>
                                    {isUploading.background ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading.background ? 'Uploading...' : 'Upload Background Images'}
                                </div>
                            </Button>
                            <input
                                id="background-image-upload"
                                ref={backgroundImageInputRef}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'background', 'background')}
                                multiple
                            />
                        </label>
                        {backgroundImages.length > 0 && (
                            <span className="text-sm text-muted-foreground">{backgroundImages.length} image(s) uploaded</span>
                        )}
                    </div>
                    {backgroundImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {backgroundImages.map(url => (
                                <div key={url} className="relative w-full aspect-square rounded-md overflow-hidden border">
                                    <Image src={url} alt="Background" fill className="object-cover" unoptimized/>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        type="button"
                                        className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-destructive/80 text-white"
                                        onClick={() => handleRemoveImage(url, 'background')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {backgroundImages.length === 0 && (
                        <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                            {isUploading.background ? <Loader2 className="animate-spin" /> : <span className="text-xs text-muted-foreground">No Background Images</span>}
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
