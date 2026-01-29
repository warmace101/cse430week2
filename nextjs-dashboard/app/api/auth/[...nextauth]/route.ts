import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-key'
);

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10 days from now')
    .sign(key);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Simple hardcoded user for demo
    if (email === 'user@nextmail.com' && password === '123456') {
      const user = {
        id: '410544b2-4001-4271-9855-fec4b6a6442a',
        name: 'User',
        email: 'user@nextmail.com',
      };

      const expires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const session = await encrypt({ user, expires });

      const response = NextResponse.json({ success: true, user });
      response.cookies.set('session', session, { expires, httpOnly: true });
      
      return response;
    }

    // Try database if available
    try {
      const postgres = require('postgres');
      const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
      const users = await sql`SELECT * FROM users WHERE email=${email}`;
      const user = users[0];
      
      if (user && await bcrypt.compare(password, user.password)) {
        const userSession = {
          id: user.id,
          name: user.name,
          email: user.email,
        };

        const expires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        const session = await encrypt({ user: userSession, expires });

        const response = NextResponse.json({ success: true, user: userSession });
        response.cookies.set('session', session, { expires, httpOnly: true });
        
        return response;
      }
    } catch (error) {
      console.log('Database error, using fallback auth');
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Auth endpoint' });
}