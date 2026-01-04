'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  X, 
  ImageIcon, 
  Loader2, 
  Camera,
  Trash2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export interface ImageUploadBoxProps {
  /** Current image URL or null */
  value: string | null;
  /** Called when a new image is uploaded */
  onUpload: (file: File) => Promise<string>;
  /** Called when image is deleted */
  onDelete?: () => Promise<void>;
  /** Aspect ratio for preview (e.g., 1 for square, 4 for wide banner) */
  aspectRatio?: number;
  /** Label text */
  label?: string;
  /** Description/hint text */
  description?: string;
  /** Custom placeholder icon */
  placeholderIcon?: React.ReactNode;
  /** Box variant styling */
  variant?: 'square' | 'banner' | 'circle';
  /** Custom className for the container */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Max file size in MB (for display) */
  maxSizeMB?: number;
}

export default function ImageUploadBox({
  value,
  onUpload,
  onDelete,
  aspectRatio,
  label,
  description,
  placeholderIcon,
  variant = 'square',
  className,
  disabled = false,
  maxSizeMB = 5,
}: ImageUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine aspect ratio based on variant
  const getAspectRatio = () => {
    if (aspectRatio) return aspectRatio;
    switch (variant) {
      case 'circle':
      case 'square':
        return 1;
      case 'banner':
        return 4;
      default:
        return 1;
    }
  };

  const getContainerStyles = () => {
    const ratio = getAspectRatio();
    switch (variant) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'banner':
        return 'rounded-xl';
      case 'square':
      default:
        return 'rounded-xl aspect-square';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleUpload(file);
    } else {
      setError('Please drop an image file');
    }
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploadSuccess(false);
    setIsUploading(true);

    try {
      await onUpload(file);
      setUploadSuccess(true);
      // Clear success state after 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setError(null);
    setIsDeleting(true);

    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  };

  const renderPlaceholder = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
      {placeholderIcon || (
        <div className={cn(
          "rounded-full p-4 mb-3 transition-colors",
          isDragging 
            ? "bg-primary/20 text-primary" 
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {variant === 'circle' ? (
            <Camera className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>
      )}
      <p className={cn(
        "text-sm font-medium transition-colors",
        isDragging ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {isDragging ? 'Drop image here' : 'Click or drag to upload'}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );

  const renderImage = () => (
    <>
      <Image
        src={value!}
        alt={label || 'Uploaded image'}
        fill
        className={cn(
          "object-cover transition-all",
          variant === 'circle' ? 'rounded-full' : 'rounded-xl'
        )}
        unoptimized
      />
      {/* Overlay with actions */}
      <div className={cn(
        "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3",
        variant === 'circle' ? 'rounded-full' : 'rounded-xl'
      )}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClick}
          disabled={isUploading || isDeleting}
          className="shadow-lg"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Replace
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting || isUploading}
            className="shadow-lg"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </>
  );

  const renderLoading = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-sm text-muted-foreground">Uploading...</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm rounded-xl pointer-events-none">
      <div className="flex items-center gap-2 text-green-600 bg-white px-4 py-2 rounded-full shadow-lg">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Uploaded!</span>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div
        onClick={!value ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-all group",
          getContainerStyles(),
          variant === 'banner' && 'aspect-[4/1]',
          !value && !disabled && "cursor-pointer hover:border-primary/50",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive",
          uploadSuccess && !isUploading && "border-green-500",
          !isDragging && !error && !uploadSuccess && "border-muted-foreground/25"
        )}
      >
        {/* Background gradient for empty state */}
        {!value && !isUploading && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30" />
        )}

        {/* Content */}
        {isUploading ? (
          renderLoading()
        ) : value ? (
          <>
            {renderImage()}
            {uploadSuccess && renderSuccess()}
          </>
        ) : (
          renderPlaceholder()
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
