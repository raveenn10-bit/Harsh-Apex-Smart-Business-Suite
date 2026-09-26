import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const session = await authenticateUser(email, password);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your demo email and password.' },
        { status: 401 }
      );
    }

    // Set HTTP-only secure cookie
    await setSessionCookie(session.email);

    return NextResponse.json({
      success: true,
      user: {
        email: session.email,
        full_name: session.full_name,
        role: session.role,
        package_code: session.package_code,
        package_name: session.package_name,
        business_id: session.business_id,
        business_name: session.business_name,
      },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('Login error:', errMessage);
    return NextResponse.json(
      { error: `Authentication failed: ${errMessage}` },
      { status: 500 }
    );
  }
}

