
import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("[Upload API] POST /api/upload called");

  try {
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
    const path = String(form.get("path") || `uploads/${Date.now()}.bin`);

    if (!file) {
      console.error("[Upload API] No file in request");
      return NextResponse.json({ error: "No file provided in the request." }, { status: 400 });
    }

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
      },
    });

    // Make file public
    await gcsFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketInstance.name}/${encodeURIComponent(path)}`;

    console.log("[Upload API] Successfully uploaded. Public URL:", publicUrl);
    return NextResponse.json({ url: publicUrl });

  } catch (err: any) {
    console.error("[Upload API] Upload failed:", err);
    console.error("[Upload API] Error details:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });

    return NextResponse.json({
      error: err?.message ?? "An unknown error occurred during upload.",
      details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    }, { status: 500 });
  }
}
