import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

// POST /api/admin/users/[id]/reset-password
// Admin resets a user's password to a temporary one
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { tempPassword } = body;

  if (!tempPassword || tempPassword.length < 6) {
    return NextResponse.json(
      { error: 'Temporary password must be at least 6 characters.' },
      { status: 400 }
    );
  }

  // Make sure user exists
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  // Prevent resetting another admin's password
  if (user.role === 'ADMIN' && user.id !== session.user.id) {
    return NextResponse.json(
      { error: 'Cannot reset another admin\'s password.' },
      { status: 403 }
    );
  }

  const hashed = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({
    where: { id },
    data:  { password: hashed },
  });

  return NextResponse.json({ success: true, message: 'Password reset successfully.' });
}
