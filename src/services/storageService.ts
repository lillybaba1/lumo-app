
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * The image is provided as a data URI.
 * @param dataUri The image as a data URI.
 * @param path The path in Firebase Storage to upload the image to.
 * @returns The public download URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(dataUri: string, path: string): Promise<string> {
    try {
        // Create a storage reference
        const storageRef = ref(storage, `${path}/${Date.now()}`);

        // Upload the file
        const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        return downloadUrl;
    } catch (error) {
        console.error("Image upload failed:", error);
        throw new Error("Could not upload image.");
    }
}
