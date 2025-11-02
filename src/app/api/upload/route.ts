
import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";

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
    await requireAdmin();
    console.log("[Upload API] Admin authentication successful");

    // Check bucket initialization
    const bucketInstance = bucket();
    if (!bucketInstance) {
      console.error("[Upload API] Bucket is null or undefined");
      return NextResponse.json({
        error: "Firebase Storage bucket not available. Please check FIREBASE_STORAGE_BUCKET environment variable."
      }, { status: 500 });
    }

    console.log("[Upload API] Bucket name:", bucketInstance.name);

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

    // Generate safe file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = customPath || `uploads/${timestamp}_${safeName}`;

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
    console.error("[Upload API] Upload failed:", err);
    console.error("[Upload API] Error details:", {
      message: err?.message,
      code: err?.code,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : 'hidden in production'
    });

    // Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? err?.message ?? "An unknown error occurred during upload."
      : "Failed to upload file. Please try again.";

    return NextResponse.json({
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: err?.stack })
    }, { status: 500 });
  }
}
