export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped image from a source image URL and crop coordinates
 * Returns a blob URL that can be used as an image source
 */
export async function createCroppedImage(
  imageSrc: string,
  crop: CropData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size to the crop size
      canvas.width = crop.width;
      canvas.height = crop.height;

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert canvas to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    image.src = imageSrc;
  });
}

/**
 * Get CSS styles to display a cropped image using CSS clip-path
 * This is a simpler alternative that doesn't require canvas
 */
export function getCropStyles(crop?: CropData, imageWidth?: number, imageHeight?: number): React.CSSProperties {
  if (!crop || !imageWidth || !imageHeight) {
    return {};
  }

  // Convert pixel values to percentages
  const left = (crop.x / imageWidth) * 100;
  const top = (crop.y / imageHeight) * 100;
  const right = ((imageWidth - crop.x - crop.width) / imageWidth) * 100;
  const bottom = ((imageHeight - crop.y - crop.height) / imageHeight) * 100;

  return {
    clipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
  };
}
