import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rows = await query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1 AND p.business_id = $2`,
    [id, session.business_id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product: rows[0] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const {
    name,
    sku,
    barcode,
    category_id,
    cost_price,
    selling_price,
    stock_quantity,
    min_stock_level,
    description,
    image_url,
    status,
  } = data;

  await query(
    `UPDATE products SET
       name = COALESCE($1, name),
       sku = COALESCE($2, sku),
       barcode = COALESCE($3, barcode),
       category_id = $4,
       cost_price = COALESCE($5, cost_price),
       selling_price = COALESCE($6, selling_price),
       stock_quantity = COALESCE($7, stock_quantity),
       min_stock_level = COALESCE($8, min_stock_level),
       description = COALESCE($9, description),
       image_url = COALESCE($10, image_url),
       status = COALESCE($11, status),
       updated_at = NOW()
     WHERE id = $12 AND business_id = $13`,
    [
      name,
      sku,
      barcode,
      category_id || null,
      cost_price !== undefined ? parseFloat(cost_price) : null,
      selling_price !== undefined ? parseFloat(selling_price) : null,
      stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
      min_stock_level !== undefined ? parseInt(min_stock_level, 10) : null,
      description,
      image_url,
      status,
      id,
      session.business_id,
    ]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await query(
    `DELETE FROM products WHERE id = $1 AND business_id = $2`,
    [id, session.business_id]
  );

  return NextResponse.json({ success: true });
}
