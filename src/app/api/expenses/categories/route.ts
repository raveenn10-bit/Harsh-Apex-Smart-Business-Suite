import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let categories = await dbQuery(
      `SELECT id, name, description FROM expense_categories WHERE business_id = $1 ORDER BY name ASC`,
      [session.business_id]
    );

    // If tenant has no categories yet, seed standard default expense categories for immediate utility
    if (categories.length === 0) {
      const defaults = [
        { name: 'Rent & Lease', desc: 'Shop / office lease payments' },
        { name: 'Utilities & Bills', desc: 'Electricity, water, internet' },
        { name: 'Salaries & Wages', desc: 'Staff payroll & commissions' },
        { name: 'Inventory & Supplies', desc: 'Packaging, office consumables' },
        { name: 'Marketing & Ads', desc: 'Social media ads and flyers' },
        { name: 'Repairs & Maintenance', desc: 'Equipment maintenance and fixes' },
      ];

      for (const d of defaults) {
        await dbQuery(
          `INSERT INTO expense_categories (business_id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [session.business_id, d.name, d.desc]
        );
      }

      categories = await dbQuery(
        `SELECT id, name, description FROM expense_categories WHERE business_id = $1 ORDER BY name ASC`,
        [session.business_id]
      );
    }

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Failed to fetch expense categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
