import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { updateBookingSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      station: true,
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isOwner = booking.userId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isOwner = booking.userId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';

  const body = await req.json();

  // Users can only cancel their own bookings
  if (!isAdmin) {
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (body.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Users can only cancel bookings' }, { status: 403 });
    }
  }

  const result = updateBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: result.data.status,
      ...(result.data.status === 'CANCELLED'
        ? { adminComment: result.data.adminComment ?? null }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      station: { select: { name: true } },
    },
  });

  return NextResponse.json({ booking: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
