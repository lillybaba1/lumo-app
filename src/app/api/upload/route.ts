
import { NextResponse } from "next/server";
import { bucket, adminStorage } from "@/lib/firebaseAdmin";
import { requireAdmin, UnauthorizedError } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const maxDuration = 60; // Maximum execution time in seconds

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

/**
 * Validates uploaded file meets security requirements
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Check file name for security (prevent path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name. File name cannot contain path separators.'
    };
  }

  return { valid: true };
}

export async function POST(req: Request) {
  console.log("[Upload API] POST /api/upload called");

  try {
    // SECURITY: Require admin authentication
    const adminUser = await requireAdmin({ redirect: false });
    console.log("[Upload API] Admin authentication successful", { adminId: adminUser.userId });

    // Check bucket initialization
    let bucketInstance = bucket();
    if (!bucketInstance) {
      console.error("[Upload API] Bucket is null or undefined");
      return NextResponse.json({
        error: "Firebase Storage bucket not available. Please check STORAGE_BUCKET environment variable."
      }, { status: 500 });
    }

    console.log("[Upload API] Bucket name:", bucketInstance.name);

    try {
      const [exists] = await bucketInstance.exists();
      if (!exists) {
        const currentName = bucketInstance.name;
        const altName = currentName.includes('.firebasestorage.app')
          ? currentName.replace('.firebasestorage.app', '.appspot.com')
          : currentName.replace('.appspot.com', '.firebasestorage.app');

        console.warn("[Upload API] Bucket not found:", currentName, "→ trying alternate:", altName);
        const alternateBucket = adminStorage().bucket(altName);
        const [altExists] = await alternateBucket.exists();

        if (altExists) {
          bucketInstance = alternateBucket;
          console.log("[Upload API] Using alternate bucket:", altName);
        } else {
          console.error("[Upload API] Alternate bucket also not found.");
          return NextResponse.json({
            error: `Firebase Storage bucket "${currentName}" was not found. ` +
              `Verify STORAGE_BUCKET is set to your actual bucket name (e.g. ${currentName.replace('.firebasestorage.app', '.appspot.com')}).`
          }, { status: 500 });
        }
      }
    } catch (bucketCheckError) {
      console.error("[Upload API] Failed to verify bucket existence:", bucketCheckError);
      // Continue; subsequent operations will surface clearer errors.
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const customPath = form.get("path") as string | null;

    if (!file) {
      console.error("[Upload API] No file in request");
      return NextResponse.json({ error: "No file provided in the request." }, { status: 400 });
    }

    // SECURITY: Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      console.error("[Upload API] File validation failed:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate safe file path with timestamp to prevent caching issues
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = customPath
      ? `${customPath}/${timestamp}_${safeName}`
      : `uploads/${timestamp}_${safeName}`;

    console.log("[Upload API] Uploading file:", {
      name: file.name,
      type: file.type,
      size: file.size,
      path: path
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const gcsFile = bucketInstance.file(path);

    await gcsFile.save(buffer, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentDisposition: 'inline',
      },
    });

    // Make file public
    await gcsFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketInstance.name}/${encodeURIComponent(path)}`;

    console.log("[Upload API] Successfully uploaded. Public URL:", publicUrl);
    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      console.warn("[Upload API] Unauthorized upload attempt:", err.message);
      return NextResponse.json({
        error: err.message || "Admin authentication required."
      }, { status: err.statusCode ?? 401 });
    }

    // Enhanced error logging for production debugging
    console.error("[Upload API] Upload failed:", err);
    console.error("[Upload API] Error details:", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack
    });

    // Log environment info for debugging
    console.error("[Upload API] Environment check:", {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !!process.env.SERVICE_ACCOUNT_JSON,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET || !!process.env.STORAGE_BUCKET,
      nodeEnv: process.env.NODE_ENV
    });

    // Provide more helpful error messages while protecting sensitive data
    let errorMessage = "Failed to upload file. Please try again.";

    if (err?.code === 'storage/unauthorized' || err?.message?.includes('permission')) {
      errorMessage = "Storage permission error. Please check Firebase Storage rules.";
    } else if (err?.message?.includes('bucket') || err?.code === 'storage/bucket-not-found') {
      errorMessage = "Storage bucket configuration error. Please contact support.";
    } else if (err?.message?.includes('service account') || err?.message?.includes('credentials')) {
      errorMessage = "Authentication error. Please contact support.";
    } else if (process.env.NODE_ENV === 'development') {
      errorMessage = err?.message ?? "An unknown error occurred during upload.";
    }

    return NextResponse.json({
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        details: err?.stack,
        errorCode: err?.code
      })
    }, { status: 500 });
  }
}
