import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const tier = searchParams.get('tier');

    let sql = `
      SELECT c.id, c.name, c.phone, c.email, c.address,
             c.total_purchases, c.total_orders, c.outstanding_balance,
             c.last_purchase_at, c.created_at,
             (SELECT count(*) FROM customer_notes cn WHERE cn.customer_id = c.id) as note_count
      FROM customers c
      WHERE c.business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length} OR c.email ILIKE $${params.length})`;
    }

    sql += ` ORDER BY c.total_purchases DESC`;

    const customers = await dbQuery(sql, params);

    // Compute loyalty tier & engagement state
    const processed = customers.map((c) => {
      const purchases = Number(c.total_purchases || 0);
      const orders = Number(c.total_orders || 0);
      let customerTier = 'Regular';
      if (purchases >= 50000 || orders >= 5) {
        customerTier = 'VIP';
      } else if (orders <= 1) {
        customerTier = 'New Lead';
      }

      return {
        ...c,
        tier: customerTier,
      };
    });

    const filtered = tier && tier !== 'all' 
      ? processed.filter((c) => c.tier.toLowerCase() === tier.toLowerCase())
      : processed;

    // Recent notes for activity timeline
    const recentNotes = await dbQuery(
      `
      SELECT cn.id, cn.note, cn.created_at,
             c.id as customer_id, c.name as customer_name,
             p.full_name as author_name
      FROM customer_notes cn
      JOIN customers c ON cn.customer_id = c.id
      LEFT JOIN profiles p ON cn.created_by = p.id
      WHERE cn.business_id = $1
      ORDER BY cn.created_at DESC
      LIMIT 15
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      customers: filtered,
      total: filtered.length,
      recent_notes: recentNotes,
    });
  } catch (error) {
    console.error('Failed to fetch CRM clients:', error);
    return NextResponse.json({ error: 'Failed to fetch CRM data' }, { status: 500 });
  }
}
