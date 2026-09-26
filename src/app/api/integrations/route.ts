import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await dbQuery(
      `SELECT * FROM integrations WHERE business_id = $1 ORDER BY created_at ASC`,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      integrations,
    });
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, status = 'connected', config = {} } = body;

    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 });
    }

    await dbQuery(
      `
      INSERT INTO integrations (business_id, provider, status, config, last_sync_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (business_id, provider)
      DO UPDATE SET status = EXCLUDED.status, config = EXCLUDED.config, last_sync_at = NOW()
      `,
      [session.business_id, provider, status, JSON.stringify(config)]
    );

    return NextResponse.json({
      success: true,
      message: `${provider} integration status updated successfully`,
    });
  } catch (error) {
    console.error('Failed to update integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}
