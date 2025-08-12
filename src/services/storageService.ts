
'use server';

import { storageAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { Stream } from 'stream';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * The image is provided as a data URI.
 * @param dataUri The image as a data URI.
 * @param path The path in Firebase Storage to upload the image to.
 * @returns The public download URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(dataUri: string, path: string): Promise<string> {
    if (!isFirebaseAdminInitialized || !storageAdmin) {
        console.error("Cannot upload image, Firebase Admin not initialized.");
        // Return a placeholder or throw an error that can be caught by the UI
        throw new Error("Image upload is not available. Please configure Firebase Admin SDK.");
    }
    
    try {
        const bucket = storageAdmin.bucket();
        const mimeType = dataUri.match(/data:(.*);base64,/)?.[1];
        if (!mimeType) {
            throw new Error('Invalid data URI');
        }

        const base64Data = dataUri.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${path}/${Date.now()}`;
        const file = bucket.file(fileName);

        const stream = new Stream.PassThrough();
        stream.end(buffer);

        await new Promise((resolve, reject) => {
            stream.pipe(file.createWriteStream({
                metadata: {
                    contentType: mimeType,
                },
            }))
            .on('error', reject)
            .on('finish', resolve);
        });

        // Make the file public and get the URL
        await file.makePublic();
        return file.publicUrl();

    } catch (error) {
        console.error("Image upload failed:", error);
        throw new Error("Could not upload image.");
    }
}
