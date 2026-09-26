import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await dbQuery(
      `
      SELECT b.name as business_name, b.slug, b.phone, b.email, b.address, b.currency, b.currency_symbol,
             bs.invoice_prefix, bs.next_invoice_number, bs.quotation_prefix, bs.next_quotation_number,
             bs.receipt_header, bs.receipt_footer, bs.primary_brand_color, bs.whatsapp_auto_send
      FROM businesses b
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE b.id = $1
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      settings: rows[0] || {},
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      business_name, phone, email, address,
      invoice_prefix, quotation_prefix,
      receipt_header, receipt_footer,
      whatsapp_auto_send
    } = body;

    // Update businesses
    if (business_name) {
      await dbQuery(
        `UPDATE businesses SET name = $1, phone = $2, email = $3, address = $4, updated_at = NOW() WHERE id = $5`,
        [business_name.trim(), phone || null, email || null, address || null, session.business_id]
      );
    }

    // Upsert business_settings
    await dbQuery(
      `
      INSERT INTO business_settings (
        business_id, invoice_prefix, quotation_prefix, receipt_header, receipt_footer, whatsapp_auto_send, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (business_id)
      DO UPDATE SET
        invoice_prefix = EXCLUDED.invoice_prefix,
        quotation_prefix = EXCLUDED.quotation_prefix,
        receipt_header = EXCLUDED.receipt_header,
        receipt_footer = EXCLUDED.receipt_footer,
        whatsapp_auto_send = EXCLUDED.whatsapp_auto_send,
        updated_at = NOW()
      `,
      [
        session.business_id,
        invoice_prefix || 'HA-INV-',
        quotation_prefix || 'HA-QTN-',
        receipt_header || 'Thank you for choosing Harsh Apex Solutions',
        receipt_footer || 'Goods sold are not returnable without original receipt.',
        whatsapp_auto_send !== undefined ? Boolean(whatsapp_auto_send) : true
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Business settings saved successfully',
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
