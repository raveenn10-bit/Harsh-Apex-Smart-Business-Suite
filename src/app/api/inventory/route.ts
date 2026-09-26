import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch inventory summary stats
    const statsQuery = await dbQuery<{
      total_products: number;
      total_stock_units: number;
      low_stock_count: number;
      out_of_stock_count: number;
      total_cost_valuation: number;
      total_retail_valuation: number;
    }>(
      `
      SELECT 
        COUNT(id)::int as total_products,
        COALESCE(SUM(stock_quantity), 0)::int as total_stock_units,
        COALESCE(SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END), 0)::int as low_stock_count,
        COALESCE(SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END), 0)::int as out_of_stock_count,
        COALESCE(SUM(stock_quantity * cost_price), 0)::numeric as total_cost_valuation,
        COALESCE(SUM(stock_quantity * selling_price), 0)::numeric as total_retail_valuation
      FROM products
      WHERE business_id = $1 AND status != 'archived'
      `,
      [session.business_id]
    );

    const stats = statsQuery[0] || {
      total_products: 0,
      total_stock_units: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      total_cost_valuation: 0,
      total_retail_valuation: 0,
    };

    // 2. Fetch products with current stock status
    const products = await dbQuery(
      `
      SELECT p.id, p.name, p.sku, p.barcode, p.stock_quantity, p.min_stock_level, 
             p.cost_price, p.selling_price, p.status, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.business_id = $1 AND p.status != 'archived'
      ORDER BY 
        CASE 
          WHEN p.stock_quantity <= 0 THEN 1
          WHEN p.stock_quantity <= p.min_stock_level THEN 2
          ELSE 3
        END,
        p.name ASC
      `,
      [session.business_id]
    );

    // 3. Fetch recent stock movement audit history
    const movements = await dbQuery(
      `
      SELECT sm.id, sm.movement_type, sm.quantity, sm.previous_quantity, sm.new_quantity,
             sm.reference_id, sm.notes, sm.created_at, p.name as product_name, p.sku
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE sm.business_id = $1
      ORDER BY sm.created_at DESC
      LIMIT 50
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      stats,
      products,
      movements,
    });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, type, quantity, notes } = body;

    if (!product_id || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'product_id, type (STOCK_IN, STOCK_OUT, ADJUSTMENT, RETURN), and quantity are required' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer' }, { status: 400 });
    }

    // Fetch existing product
    const existing = await dbQuery<{ id: string; stock_quantity: number; name: string }>(
      `SELECT id, stock_quantity, name FROM products WHERE id = $1 AND business_id = $2`,
      [product_id, session.business_id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentStock = existing[0].stock_quantity;
    let newStock = currentStock;

    if (type === 'STOCK_IN' || type === 'RETURN') {
      newStock = currentStock + qty;
    } else if (type === 'STOCK_OUT') {
      if (currentStock < qty) {
        return NextResponse.json(
          { error: `Insufficient stock. Current stock is ${currentStock} units.` },
          { status: 400 }
        );
      }
      newStock = currentStock - qty;
    } else if (type === 'ADJUSTMENT') {
      // Direct count override
      newStock = qty;
    } else {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
    }

    const stockStatus = newStock === 0 ? 'out_of_stock' : 'active';

    // Update product stock
    await dbQuery(
      `UPDATE products SET stock_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3 AND business_id = $4`,
      [newStock, stockStatus, product_id, session.business_id]
    );

    // Update or insert inventory table
    await dbQuery(
      `INSERT INTO inventory (business_id, product_id, quantity, location, updated_at)
       VALUES ($1, $2, $3, 'Main Warehouse', NOW())
       ON CONFLICT (business_id, product_id)
       DO UPDATE SET quantity = $3, updated_at = NOW()`,
      [session.business_id, product_id, newStock]
    );

    // Record immutable audit movement
    await dbQuery(
      `INSERT INTO stock_movements (
        business_id, product_id, movement_type, quantity, previous_quantity, new_quantity, reference_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        session.business_id,
        product_id,
        type,
        qty,
        currentStock,
        newStock,
        `ADJ-${Date.now().toString().slice(-6)}`,
        notes || `Stock ${type.toLowerCase()} manually recorded`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Stock updated successfully for ${existing[0].name}. New balance: ${newStock} units.`,
      new_stock: newStock,
    });
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return NextResponse.json({ error: 'Failed to process inventory update' }, { status: 500 });
  }
}
