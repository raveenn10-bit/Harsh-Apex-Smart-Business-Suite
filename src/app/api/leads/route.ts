import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      business_name,
      whatsapp_number,
      email,
      business_type = 'Retail & Wholesale',
      interested_package = 'Business',
      message
    } = body;

    if (!customer_name || !whatsapp_number || !email) {
      return NextResponse.json({ error: 'Name, WhatsApp number, and Email are required' }, { status: 400 });
    }

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO leads (
        customer_name, business_name, whatsapp_number, email,
        business_type, interested_package, message, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
      RETURNING id
      `,
      [
        customer_name.trim(),
        business_name ? business_name.trim() : customer_name.trim() + ' Enterprise',
        whatsapp_number.trim(),
        email.trim(),
        business_type,
        interested_package,
        message ? message.trim() : null
      ]
    );

    return NextResponse.json({
      success: true,
      lead_id: result[0].id,
      message: 'Thank you! Your Harsh Apex Suite consultation request has been received. Our solutions architect will connect with you via WhatsApp.',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit consultation lead:', error);
    return NextResponse.json({ error: 'Failed to submit consultation inquiry' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const leads = await dbQuery(
      `SELECT * FROM leads ORDER BY created_at DESC LIMIT 50`
    );

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
    });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
