import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import path from 'path';
import fs from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'product-images';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed formats: JPG, PNG, WEBP.`,
      }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: `File exceeds maximum allowed size of 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Isolated path per tenant: public/uploads/{tenant_id}/{bucket}/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', session.business_id, bucket);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'webp';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${session.business_id}/${bucket}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mime_type: file.type,
      message: 'Image uploaded and processed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'File upload processing failed' }, { status: 500 });
  }
}
