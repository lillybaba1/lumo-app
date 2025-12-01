import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

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

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Require authentication for file uploads
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user is admin for admin-only folders
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string) || 'uploads';
        
        // Admin-only folders require admin role
        const adminOnlyFolders = ['chatbot', 'hero', 'store'];
        if (adminOnlyFolders.includes(folder)) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            if (profile?.role !== 'admin') {
                return NextResponse.json(
                    { error: 'Admin access required for this folder' },
                    { status: 403 }
                );
            }
        }

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type ${file.type} is not allowed` },
                { status: 400 }
            );
        }

        // Validate file name for security
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
            return NextResponse.json(
                { error: 'Invalid file name' },
                { status: 400 }
            );
        }

        // Generate safe file path
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() ?? 'jpg';
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${safeName}`;
        const filePath = `${folder}/${fileName}`;

        console.log('[Upload API] Uploading to Supabase Storage:', filePath);

        // Convert File to Buffer for server-side upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage using admin client
        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(filePath, buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (error) {
            console.error('[Upload API] Supabase upload error:', error);
            return NextResponse.json(
                { error: `Upload failed: ${error.message}` },
                { status: 500 }
            );
        }

        if (!data?.path) {
            return NextResponse.json(
                { error: 'No path returned from upload' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(data.path);

        console.log('[Upload API] Upload successful, public URL:', publicUrl);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path
        });

    } catch (error) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
