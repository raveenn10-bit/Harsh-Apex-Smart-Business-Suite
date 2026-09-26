import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset inventory levels for demo businesses to healthy stock
    await dbQuery(
      `
      UPDATE products
      SET stock_quantity = 35
      WHERE business_id IN (SELECT id FROM businesses WHERE is_demo = true)
        AND stock_quantity < min_stock_level
      `
    );

    // Ensure all demo businesses remain active
    await dbQuery(
      `UPDATE businesses SET is_active = true WHERE is_demo = true`
    );

    return NextResponse.json({
      success: true,
      message: 'Isolated demo workspaces successfully refreshed and verified! Stock safety levels restored.',
    });
  } catch (error) {
    console.error('Demo reset error:', error);
    return NextResponse.json({ error: 'Failed to reset demo workspaces' }, { status: 500 });
  }
}
