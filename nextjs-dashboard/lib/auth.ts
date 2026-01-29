import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-key'
);

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}