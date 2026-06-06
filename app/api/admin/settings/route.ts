import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const updateSchema = z.array(
  z.object({
    key:   z.string().min(1),
    value: z.string(),
    label: z.string().optional(),
  })
);

// GET — all settings with labels (admin UI)
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json({ settings });
}

// PUT — upsert one or more settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid data', issues: result.error.issues }, { status: 400 });
  }

  const updated = await Promise.all(
    result.data.map((s) =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value, ...(s.label ? { label: s.label } : {}) },
        create: { key: s.key, value: s.value, label: s.label },
      })
    )
  );

  return NextResponse.json({ settings: updated });
}
