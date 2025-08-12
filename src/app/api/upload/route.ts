
import { NextResponse } from "next/server";
import { bucket, isFirebaseAdminInitialized } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("POST /api/upload called");
  if (!isFirebaseAdminInitialized || !bucket) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized. Please check server logs." }, { status: 500 });
  }
    
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const path  = String(form.get("path") || `theme/${Date.now()}.bin`);

    if (!file) return NextResponse.json({ error: "No file provided in the request." }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const gcsFile = bucket.file(path);
    await gcsFile.save(buffer, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURI(path)}`;
    console.log("Successfully generated public URL:", publicUrl);
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload to Firebase Storage failed:", err);
    return NextResponse.json({ error: err?.message ?? "An unknown error occurred during upload." }, { status: 500 });
  }
}
