import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();

    const accessPassword = process.env.ACCESS_PASSWORD;

    if (!accessPassword) {
      return NextResponse.json(
        { valid: false, message: 'The server is not configured with an access password' },
        { status: 400 }
      );
    }

    if (password === accessPassword) {
      return NextResponse.json({ valid: true, message: 'Password verification successful' });
    }

    return NextResponse.json(
      { valid: false, message: 'Incorrect password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
