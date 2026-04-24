import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export interface UserPayload {
  id: string;
  username: string;
  email: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// Get current user from cookies (for API routes)
export async function getCurrentUser(req?: any): Promise<UserPayload | null> {
  try {
    let token: string | undefined;
    
    if (req?.cookies?.get) {
      token = req.cookies.get('token')?.value;
    } else if (typeof window === 'undefined') {
      // Server component
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }
    
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
// Get user ID (for API routes)
export async function getCurrentUserId(req?: any): Promise<string | null> {
  const user = await getCurrentUser(req);
  return user?.id || null;
}

// Authenticate middleware for API routes
export async function requireAuth(req?: any): Promise<string> {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
