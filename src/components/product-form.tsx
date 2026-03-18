
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
import { Loader2, Upload, X, Save, Crop as CropIcon, Sparkles, Star } from 'lucide-react';
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
    userType?: 'admin' | 'seller';
};

function SubmitButton({ isSubmitting }: { isSubmitting?: boolean }) {
    const { pending } = useFormStatus();
    const disabled = pending || isSubmitting;
    return (
        <Button type="submit" disabled={disabled}>
            {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {disabled ? 'Saving...' : 'Save Product'}
        </Button>
    );
}

const initialState = { success: false, message: '' };

export default function ProductForm({ product = null, categories, userType = 'admin' }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [state, formAction] = useFormState(saveProduct, initialState);
    const [imageUrls, setImageUrls] = React.useState<string[]>(product?.imageUrls || []);
    // Initialize productImages from structured data if available, otherwise fall back to legacy imageUrls
    
    // Determine API endpoint based on user type
    const aiEndpoint = userType === 'seller' 
        ? '/api/business/ai/generate-description' 
        : '/api/admin/ai/generate-description';
    
    // Determine redirect URL based on user type
    const redirectUrl = userType === 'seller' ? '/business/products' : '/admin/products';
    const [productImages, setProductImages] = React.useState<string[]>(
        (product?.productImages && product.productImages.length > 0) 
            ? product.productImages 
            : (product?.imageUrls || [])
    );
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<string>('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const productImageInputRef = React.useRef<HTMLInputElement>(null);

    // Crop data state
    const [imageCropData, setImageCropData] = React.useState<Map<string, CropData>>(new Map());

    // Product attributes
    const [attributes, setAttributes] = React.useState<ProductAttribute[]>([]);

    // AI content generation
    const [description, setDescription] = React.useState<string>(product?.description || '');
    const [isGeneratingDescription, setIsGeneratingDescription] = React.useState(false);
    const [productName, setProductName] = React.useState<string>(product?.name || '');
    const [isGeneratingTitle, setIsGeneratingTitle] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState<string>(product?.categoryId || product?.category || '');
    const [isGeneratingAttributes, setIsGeneratingAttributes] = React.useState(false);

    // Crop modal state — optional post-upload cropping only
    const [cropModalOpen, setCropModalOpen] = React.useState(false);
    const [currentCropImage, setCurrentCropImage] = React.useState<string>('');

    // Keep local state in sync if a different product record is loaded
    React.useEffect(() => {
        setImageUrls(product?.imageUrls || []);
        setProductImages(
            (product?.productImages && product.productImages.length > 0)
                ? product.productImages
                : (product?.imageUrls || [])
        );
        setDescription(product?.description || '');
        setProductName(product?.name || '');
        setSelectedCategory(product?.categoryId || product?.category || '');
    }, [product?.id, product?.imageUrls, product?.productImages, product?.description, product?.name, product?.categoryId, product?.category]);

    React.useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success',
                description: product ? 'Product updated successfully' : 'Product created successfully',
            });
            router.push(redirectUrl);
        } else if (state.message) {
            toast({
                title: 'Error',
                description: state.message,
                variant: 'destructive',
            });
            // Reset submission state on error so user can retry
            setIsSubmitting(false);
        }
    }, [state, product, router, toast, redirectUrl]);

    // Direct batch upload — no mandatory crop modal per image
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > 4 * 1024 * 1024) {
                toast({ title: "Too large", description: `${file.name} exceeds 4MB. Skipped.`, variant: "destructive" });
                continue;
            }
            validFiles.push(file);
        }
        if (validFiles.length === 0) return;

        setIsUploading(true);
        let uploaded = 0;

        for (const file of validFiles) {
            uploaded++;
            setUploadProgress(`Uploading ${uploaded}/${validFiles.length}...`);
            try {
                const url = await uploadImageAndGetUrl(file, `products/${Date.now()}-${file.name}`);
                setProductImages(prev => [...prev, url]);
            } catch (error: any) {
                toast({ title: 'Upload failed', description: `${file.name}: ${error.message}`, variant: 'destructive' });
            }
        }

        setIsUploading(false);
        setUploadProgress('');
        toast({ title: 'Done', description: `${uploaded} image(s) uploaded.` });

        if (productImageInputRef.current) {
            productImageInputRef.current.value = '';
        }
    };

    // Open crop modal for an existing image (optional)
    const handleOpenCropModal = (imageUrl: string) => {
        setCurrentCropImage(imageUrl);
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

    const handleRemoveImage = (urlToRemove: string) => {
        setProductImages(prev => prev.filter(url => url !== urlToRemove));

        // Remove crop data
        setImageCropData(prev => {
            const updated = new Map(prev);
            updated.delete(urlToRemove);
            return updated;
        });
    };

    const handleSetPrimary = (url: string) => {
        setProductImages(prev => {
            const filtered = prev.filter(u => u !== url);
            return [url, ...filtered];
        });
    };

    const handleGenerateTitle = async () => {
        if (productImages.length === 0) {
            toast({
                title: 'No images uploaded',
                description: 'Please upload at least one product image before generating a title.',
                variant: 'destructive',
            });
            return;
        }

        setIsGeneratingTitle(true);

        try {
            const imagesToAnalyze = productImages.slice(0, 5);

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'title',
                    category: selectedCategory || undefined,
                    description: description || undefined,
                    imageUrls: imagesToAnalyze,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to generate title');
            }

            const data = await response.json();

            if (data.success && data.title) {
                setProductName(data.title);
                toast({
                    title: 'Title generated!',
                    description: 'AI has generated a product title. You can edit it as needed.',
                });
            } else {
                throw new Error('No title received');
            }
        } catch (error: any) {
            console.error('[AI Title] Error:', error);
            toast({
                title: 'Generation failed',
                description: error.message || 'Could not generate title. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingTitle(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (productImages.length === 0) {
            toast({
                title: 'No images uploaded',
                description: 'Please upload at least one product image before generating a description.',
                variant: 'destructive',
            });
            return;
        }

        setIsGeneratingDescription(true);

        try {
            const imagesToAnalyze = productImages.slice(0, 5);

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'description',
                    productName: productName || undefined,
                    category: selectedCategory || undefined,
                    imageUrls: imagesToAnalyze,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to generate description');
            }

            const data = await response.json();

            if (data.success && data.description) {
                setDescription(data.description);
                toast({
                    title: 'Description generated!',
                    description: 'AI has generated a product description. You can edit it as needed.',
                });
            } else {
                throw new Error('No description received');
            }
        } catch (error: any) {
            console.error('[AI Description] Error:', error);
            toast({
                title: 'Generation failed',
                description: error.message || 'Could not generate description. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleGenerateAttributes = async () => {
        if (productImages.length === 0) {
            toast({
                title: 'No images uploaded',
                description: 'Please upload at least one product image before generating attributes.',
                variant: 'destructive',
            });
            return;
        }

        setIsGeneratingAttributes(true);

        try {
            const imagesToAnalyze = productImages.slice(0, 5);

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'attributes',
                    productName: productName || undefined,
                    category: selectedCategory || undefined,
                    description: description || undefined,
                    imageUrls: imagesToAnalyze,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to generate attributes');
            }

            const data = await response.json();

            if (data.success && data.attributes && Array.isArray(data.attributes)) {
                // Convert to ProductAttribute format
                const newAttributes: ProductAttribute[] = data.attributes.map((attr: any, index: number) => ({
                    attributeName: attr.name || '',
                    attributeValue: attr.value || '',
                    attributeGroup: 'specification',
                    displayOrder: attributes.length + index,
                    isVariant: false,
                    priceModifier: 0,
                    stockModifier: 0,
                }));
                // Append to existing attributes instead of replacing
                setAttributes([...attributes, ...newAttributes]);
                toast({
                    title: 'Attributes generated!',
                    description: `AI has generated ${newAttributes.length} product attributes. You can edit or remove them as needed.`,
                });
            } else {
                throw new Error('No attributes received');
            }
        } catch (error: any) {
            console.error('[AI Attributes] Error:', error);
            toast({
                title: 'Generation failed',
                description: error.message || 'Could not generate attributes. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingAttributes(false);
        }
    };

    const handleSubmit = (formData: FormData) => {
        // Prevent double submission
        if (isSubmitting) {
            console.log('[Product Form] Ignoring duplicate submission');
            return;
        }
        
        if (productImages.length === 0 && imageUrls.length === 0) {
            toast({ title: 'Image Required', description: 'Please upload at least one product image.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        
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

            <CardContent className="space-y-5 pt-6">

                {/* ── Images First (most important) ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Product Images *</Label>
                            <p className="text-xs text-muted-foreground">At least one required. First image is the main photo.</p>
                        </div>
                        <label htmlFor="product-image-upload" className="cursor-pointer">
                            <Button asChild variant="outline" size="sm" type="button" disabled={isUploading}>
                                <div>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading ? uploadProgress : 'Upload Images'}
                                </div>
                            </Button>
                            <input
                                id="product-image-upload"
                                ref={productImageInputRef}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    {productImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {productImages.map((url, idx) => (
                                <div key={url} className="relative group">
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors">
                                        <Image src={url} alt={`Product ${idx + 1}`} fill className="object-cover" unoptimized />
                                        {/* Primary badge */}
                                        {idx === 0 && (
                                            <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-br-md">
                                                MAIN
                                            </div>
                                        )}
                                        {/* Overlay actions on hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                type="button"
                                                className="h-7 w-7"
                                                onClick={() => handleOpenCropModal(url)}
                                                title="Crop"
                                            >
                                                <CropIcon className="h-3.5 w-3.5" />
                                            </Button>
                                            {idx !== 0 && (
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    type="button"
                                                    className="h-7 w-7"
                                                    onClick={() => handleSetPrimary(url)}
                                                    title="Set as main image"
                                                >
                                                    <Star className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                type="button"
                                                className="h-7 w-7"
                                                onClick={() => handleRemoveImage(url)}
                                                title="Remove"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                            {isUploading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {uploadProgress}
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground">No images yet — click Upload Images above</span>
                            )}
                        </div>
                    )}
                    {productImages.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {productImages.length} image(s) • Hover to crop, set as main, or remove
                        </p>
                    )}
                </div>

                {/* ── Name + Category ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="name">Product Name</Label>
                            <Button
                                type="button" variant="ghost" size="sm"
                                onClick={handleGenerateTitle}
                                disabled={isGeneratingTitle || productImages.length === 0}
                                className="gap-1 h-6 text-xs px-2"
                            >
                                {isGeneratingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                AI
                            </Button>
                        </div>
                        <Input
                            id="name" name="name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required placeholder="Product name..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={selectedCategory} onValueChange={setSelectedCategory} required>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ── Description ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="description">Description</Label>
                        <Button
                            type="button" variant="ghost" size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDescription || productImages.length === 0}
                            className="gap-1 h-6 text-xs px-2"
                        >
                            {isGeneratingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Generate with AI
                        </Button>
                    </div>
                    <Textarea
                        id="description" name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required rows={3}
                        placeholder="Product description..."
                    />
                    {productImages.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">💡 Upload images first, then use AI to generate a description</p>
                    )}
                </div>

                {/* ── Price + Stock ── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="number" defaultValue={product?.stock} required />
                    </div>
                </div>

                {/* ── Product Attributes (admin only) ── */}
                {userType === 'admin' && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium">Product Attributes</h3>
                                    <p className="text-xs text-muted-foreground">Specs, features, or variants</p>
                                </div>
                                <Button
                                    type="button" variant="outline" size="sm"
                                    onClick={handleGenerateAttributes}
                                    disabled={isGeneratingAttributes || productImages.length === 0}
                                    className="gap-1 h-7 text-xs"
                                >
                                    {isGeneratingAttributes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Generate with AI
                                </Button>
                            </div>
                            <ProductAttributesManager attributes={attributes} onChange={setAttributes} />
                        </div>
                    </>
                )}

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <SubmitButton isSubmitting={isSubmitting} />
            </CardFooter>

            {/* Optional Crop Modal (post-upload) */}
            <ImageCropModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={currentCropImage}
                onCropComplete={handlePostUploadCropComplete}
                allowOriginal={false}
                initialCrop={imageCropData.get(currentCropImage)}
            />
        </form>
    );
}
