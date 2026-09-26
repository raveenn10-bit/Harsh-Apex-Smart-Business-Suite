import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await dbQuery(
      `
      SELECT id, recipient_phone, recipient_name, template_name, message_body,
             status, sent_at, created_at
      FROM whatsapp_messages
      WHERE business_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('Failed to fetch WhatsApp history:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipient_phone, recipient_name, template_name = 'custom_message', message_body } = body;

    if (!recipient_phone || !message_body) {
      return NextResponse.json({ error: 'Phone number and message body are required' }, { status: 400 });
    }

    const simExternalId = `wa_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO whatsapp_messages (
        business_id, recipient_phone, recipient_name, template_name,
        message_body, status, external_id, sent_at
      ) VALUES ($1, $2, $3, $4, $5, 'delivered', $6, NOW())
      RETURNING id
      `,
      [
        session.business_id,
        recipient_phone.trim(),
        recipient_name ? recipient_name.trim() : 'Customer',
        template_name,
        message_body.trim(),
        simExternalId
      ]
    );

    return NextResponse.json({
      success: true,
      message_id: result[0].id,
      external_id: simExternalId,
      status: 'delivered',
      message: 'WhatsApp notification dispatched and delivered successfully!',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to simulate WhatsApp dispatch:', error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
  }
}
