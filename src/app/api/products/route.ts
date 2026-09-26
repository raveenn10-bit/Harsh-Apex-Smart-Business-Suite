import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { Product } from '@/types/database';

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';

  let sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.business_id = $1
  `;
  const params: unknown[] = [session.business_id];
  let paramIdx = 2;

  if (search) {
    sql += ` AND (LOWER(p.name) LIKE $${paramIdx} OR LOWER(p.sku) LIKE $${paramIdx} OR LOWER(COALESCE(p.barcode, '')) LIKE $${paramIdx})`;
    params.push(`%${search.toLowerCase()}%`);
    paramIdx++;
  }

  if (categoryId && categoryId !== 'all') {
    sql += ` AND p.category_id = $${paramIdx}`;
    params.push(categoryId);
    paramIdx++;
  }

  if (status && status !== 'all') {
    sql += ` AND p.status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  }

  sql += ` ORDER BY p.created_at DESC`;

  const products = await query<Product>(sql, params);
  return NextResponse.json({ success: true, products });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    if (!name || !sku || selling_price === undefined) {
      return NextResponse.json(
        { error: 'Product name, SKU, and selling price are required' },
        { status: 400 }
      );
    }

    const cost = parseFloat(cost_price) || 0;
    const price = parseFloat(selling_price) || 0;
    const stock = parseInt(stock_quantity, 10) || 0;
    const minStock = parseInt(min_stock_level, 10) || 5;

    // 1. Insert product
    const insertedProduct = await query<{ id: string }>(
      `INSERT INTO products (
        business_id, name, sku, barcode, category_id,
        cost_price, selling_price, stock_quantity, min_stock_level,
        description, image_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        session.business_id,
        name,
        sku,
        barcode || null,
        category_id || null,
        cost,
        price,
        stock,
        minStock,
        description || null,
        image_url || '/logo.png',
        status || 'active',
      ]
    );

    const productId = insertedProduct[0].id;

    // 2. Insert corresponding inventory record
    await query(
      `INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
       VALUES ($1, $2, $3, 0, 'Main Store')
       ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [session.business_id, productId, stock]
    );

    // 3. Log initial stock movement
    if (stock > 0) {
      await query(
        `INSERT INTO stock_movements (
          business_id, product_id, movement_type, quantity,
          previous_quantity, new_quantity, notes, created_by
        ) VALUES ($1, $2, 'STOCK_IN', $3, 0, $3, 'Initial inventory setup', $4)`,
        [session.business_id, productId, stock, session.profile_id]
      );
    }

    return NextResponse.json({ success: true, product_id: productId });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
