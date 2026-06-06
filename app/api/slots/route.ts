import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get('stationId');
  const date = searchParams.get('date');

  if (!stationId || !date) {
    return NextResponse.json({ error: 'stationId and date are required' }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      stationId,
      date,
      status: { not: 'CANCELLED' },
    },
    select: {
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  return NextResponse.json({ bookings });
}
