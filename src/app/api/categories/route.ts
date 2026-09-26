import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await query(
    `SELECT id, name, slug, description, image_url, created_at
     FROM categories
     WHERE business_id = $1
     ORDER BY name ASC`,
    [session.business_id]
  );

  return NextResponse.json({ success: true, categories });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, image_url } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const inserted = await query<{ id: string }>(
    `INSERT INTO categories (business_id, name, slug, description, image_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (business_id, slug) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description
     RETURNING id`,
    [session.business_id, name, slug, description || null, image_url || null]
  );

  return NextResponse.json({ success: true, category_id: inserted[0]?.id });
}
