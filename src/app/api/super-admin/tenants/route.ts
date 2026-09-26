import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Directory with aggregates
    const tenants = await dbQuery(
      `
      SELECT b.id, b.name, b.slug, b.business_type, b.phone, b.email, b.is_active, b.is_demo, b.created_at,
             p.code as package_code, p.name as package_name,
             (SELECT count(*) FROM profiles pr WHERE pr.business_id = b.id) as staff_count,
             (SELECT count(*) FROM orders o WHERE o.business_id = b.id AND o.status != 'cancelled') as total_orders,
             (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.business_id = b.id AND o.status != 'cancelled') as total_revenue
      FROM businesses b
      JOIN packages p ON b.package_id = p.id
      ORDER BY b.created_at ASC
      `
    );

    // Global platform KPIs
    const totalTenants = tenants.length;
    const globalRevenue = tenants.reduce((acc, t) => acc + Number(t.total_revenue || 0), 0);
    const globalOrders = tenants.reduce((acc, t) => acc + Number(t.total_orders || 0), 0);

    return NextResponse.json({
      success: true,
      tenants,
      kpis: {
        total_tenants: totalTenants,
        global_revenue: globalRevenue,
        global_orders: globalOrders,
      },
    });
  } catch (error) {
    console.error('Super admin tenants fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}
