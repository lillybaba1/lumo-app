
'use client';

/**
 * Uploads an image file to a server endpoint and returns the URL.
 * @param file The image file to upload.
 * @param path The path to use for the upload.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(file: File, path: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Upload failed');
    }

    const { url } = await response.json();
    return url;
}
