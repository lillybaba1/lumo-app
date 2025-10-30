
'use client';

/**
 * Uploads an image file to a server endpoint and returns the URL.
 * @param file The image file to upload.
 * @param path The path to use for the upload.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(file: File, path: string): Promise<string> {
    console.log('[Storage] Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        path: path
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        console.log('[Storage] Upload response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('[Storage] Upload failed:', errorBody);
            throw new Error(errorBody.error || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log('[Storage] Upload successful, URL:', result.url);

        if (!result.url) {
            throw new Error('No URL returned from upload endpoint');
        }

        return result.url;

    } catch (error) {
        console.error('[Storage] Upload error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Upload failed: Network or server error');
    }
}
