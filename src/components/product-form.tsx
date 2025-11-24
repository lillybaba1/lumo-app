
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
import { Loader2, Upload, X, Save, Crop as CropIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProduct } from '@/app/admin/products/actions';
import { uploadImageAndGetUrl } from '@/services/storageService';
import { Product, Category, CropData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ImageCropModal from '@/components/image-crop-modal';
import ProductAttributesManager, { ProductAttribute } from '@/components/product-attributes-manager';
import { Separator } from '@/components/ui/separator';

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

    // Crop data state
    const [imageCropData, setImageCropData] = React.useState<Map<string, CropData>>(new Map());

    // Product attributes
    const [attributes, setAttributes] = React.useState<ProductAttribute[]>([]);

    // Crop modal state
    const [cropModalOpen, setCropModalOpen] = React.useState(false);
    const [currentCropImage, setCurrentCropImage] = React.useState<string>('');
    const [currentCropType, setCurrentCropType] = React.useState<'product' | 'foreground' | 'background'>('product');
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);

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
        type: 'product' | 'foreground' | 'background'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            toast({ title: "Image too large", description: "Max 4MB.", variant: "destructive" });
            return;
        }

        // Create object URL for preview in crop modal
        const objectUrl = URL.createObjectURL(file);
        setCurrentCropImage(objectUrl);
        setCurrentCropType(type);
        setPendingFile(file);
        setCropModalOpen(true);
    };

    const handleCropComplete = async (cropData: CropData) => {
        if (!pendingFile) return;

        const folder = currentCropType === 'product' ? 'products' : currentCropType;
        setIsUploading(prev => ({ ...prev, [currentCropType]: true }));

        try {
            const url = await uploadImageAndGetUrl(pendingFile, `${folder}/${Date.now()}-${pendingFile.name}`);

            // Add image to appropriate array
            if (currentCropType === 'product') {
                setProductImages(prev => [...prev, url]);
            } else if (currentCropType === 'foreground') {
                setForegroundImages(prev => [...prev, url]);
            } else if (currentCropType === 'background') {
                setBackgroundImages(prev => [...prev, url]);
            }

            // Store crop data
            setImageCropData(prev => {
                const updated = new Map(prev);
                updated.set(url, cropData);
                return updated;
            });

            toast({
                title: 'Upload successful',
                description: 'Image uploaded and cropped.',
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsUploading(prev => ({ ...prev, [currentCropType]: false }));
            setPendingFile(null);
            URL.revokeObjectURL(currentCropImage);

            // Reset file input
            const inputRef = currentCropType === 'product' ? productImageInputRef :
                           currentCropType === 'foreground' ? foregroundImageInputRef :
                           backgroundImageInputRef;
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleOpenCropModal = (imageUrl: string, type: 'product' | 'foreground' | 'background') => {
        setCurrentCropImage(imageUrl);
        setCurrentCropType(type);
        setCropModalOpen(true);
    };

    const handlePostUploadCropComplete = (cropData: CropData) => {
        if (!currentCropImage) return;

        setImageCropData(prev => {
            const updated = new Map(prev);
            updated.set(currentCropImage, cropData);
            return updated;
        });

        toast({
            title: 'Crop updated',
            description: 'Image crop adjusted.',
            variant: 'default'
        });
    };

    const handleRemoveImage = (urlToRemove: string, type: 'product' | 'foreground' | 'background') => {
        if (type === 'product') {
            setProductImages(prev => prev.filter(url => url !== urlToRemove));
        } else if (type === 'foreground') {
            setForegroundImages(prev => prev.filter(url => url !== urlToRemove));
        } else if (type === 'background') {
            setBackgroundImages(prev => prev.filter(url => url !== urlToRemove));
        }

        // Remove crop data
        setImageCropData(prev => {
            const updated = new Map(prev);
            updated.delete(urlToRemove);
            return updated;
        });
    }

    const handleSubmit = (formData: FormData) => {
        if (productImages.length === 0 && imageUrls.length === 0) {
            toast({ title: 'Image Required', description: 'Please upload at least one product image.', variant: 'destructive' });
            return;
        }

        // Add crop data to form
        const cropDataObj: Record<string, CropData> = {};
        imageCropData.forEach((crop, url) => {
            cropDataObj[url] = crop;
        });
        formData.append('imageCropData', JSON.stringify(cropDataObj));

        // Add attributes to form
        formData.append('attributes', JSON.stringify(attributes));

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
                                onChange={(e) => handleImageChange(e, 'product')}
                            />
                        </label>
                        {productImages.length > 0 && (
                            <span className="text-sm text-muted-foreground">{productImages.length} image(s) uploaded</span>
                        )}
                    </div>
                    {productImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {productImages.map(url => (
                                <div key={url} className="relative space-y-2">
                                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={() => handleOpenCropModal(url, 'product')}
                                        className="w-full"
                                    >
                                        <CropIcon className="h-3 w-3 mr-1" />
                                        Crop
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
                                onChange={(e) => handleImageChange(e, 'foreground')}
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
                                onChange={(e) => handleImageChange(e, 'background')}
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

                <Separator className="my-8" />

                {/* Product Attributes Section */}
                <ProductAttributesManager
                    attributes={attributes}
                    onChange={setAttributes}
                />

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <SubmitButton />
            </CardFooter>

            {/* Image Crop Modal */}
            <ImageCropModal
                isOpen={cropModalOpen}
                onClose={() => {
                    setCropModalOpen(false);
                    if (currentCropImage.startsWith('blob:')) {
                        URL.revokeObjectURL(currentCropImage);
                    }
                }}
                imageSrc={currentCropImage}
                onCropComplete={pendingFile ? handleCropComplete : handlePostUploadCropComplete}
                initialCrop={imageCropData.get(currentCropImage)}
            />
        </form>
    );
}
