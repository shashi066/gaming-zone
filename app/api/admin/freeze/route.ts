import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { addHours } from '@/lib/utils';
import { z } from 'zod';

const freezeSchema = z.object({
  stationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(1).max(12),
  reason: z.string().optional(),
});

// GET /api/admin/freeze — list all frozen slots (BLOCKED bookings)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const stationId = searchParams.get('stationId');

  const where: Record<string, unknown> = { status: 'BLOCKED' };
  if (date) where.date = date;
  if (stationId) where.stationId = stationId;

  const frozen = await prisma.booking.findMany({
    where,
    include: { station: { select: { id: true, name: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({ frozen });
}

// POST /api/admin/freeze — freeze a slot
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = freezeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.issues }, { status: 400 });
    }

    const { stationId, date, startTime, duration, reason } = result.data;
    const endTime = addHours(startTime, duration);

    // Check station exists
    const station = await prisma.station.findUnique({ where: { id: stationId } });
    if (!station || !station.isActive) {
      return NextResponse.json({ error: 'Station not found or inactive' }, { status: 404 });
    }

    // Check for any existing bookings (including other frozen) in this slot
    const conflicts = await prisma.booking.findMany({
      where: { stationId, date, status: { not: 'CANCELLED' } },
    });

    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);

    for (const b of conflicts) {
      const [bStart] = b.startTime.split(':').map(Number);
      const [bEnd] = b.endTime.split(':').map(Number);
      if (startH < bEnd && endH > bStart) {
        const label = b.status === 'BLOCKED' ? 'already frozen' : 'already booked by a customer';
        return NextResponse.json(
          { error: `This slot is ${label}. Please choose a different time.` },
          { status: 409 }
        );
      }
    }

    const frozen = await prisma.booking.create({
      data: {
        userId: session.user.id,   // admin's user ID as placeholder
        stationId,
        date,
        startTime,
        endTime,
        duration,
        totalPrice: 0,
        status: 'BLOCKED',
        notes: reason ? `[Walk-in] ${reason}` : '[Walk-in] Reserved for offline customer',
      },
      include: { station: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ frozen }, { status: 201 });
  } catch (error) {
    console.error('Freeze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/freeze?id=xxx — unfreeze a slot
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status !== 'BLOCKED') {
    return NextResponse.json({ error: 'Frozen slot not found' }, { status: 404 });
  }

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
