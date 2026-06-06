import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json();
  const station = await prisma.station.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description && { description: body.description }),
      ...(body.specs && { specs: body.specs }),
      ...(body.hourlyRate !== undefined && { hourlyRate: parseFloat(body.hourlyRate) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json({ station });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;

  await prisma.station.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
