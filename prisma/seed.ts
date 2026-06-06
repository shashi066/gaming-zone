import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Default Settings ──────────────────────────────────────────
  await prisma.setting.upsert({
    where:  { key: 'controller_price' },
    update: {},
    create: { key: 'controller_price', value: '30', label: 'Extra Controller Price (per controller, per booking)' },
  });
  console.log('✅ Settings seeded');

  // ── Admin User ────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@gamezone.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123';
  const hashed = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: {
      email:    adminEmail,
      name:     'Admin',
      password: hashed,
      role:     'ADMIN',
    },
  });
  console.log(`✅ Admin user: ${adminEmail}`);

  // ── Sample Stations ───────────────────────────────────────────
  const stations = [
    { name: 'Alpha Station', description: 'High-performance PC for competitive gaming', specs: 'RTX 4080 · i9-13900K · 32GB RAM · 240Hz 1440p', hourlyRate: 150, position: 1 },
    { name: 'Beta Station',  description: 'Mid-range PC perfect for casual gaming',     specs: 'RTX 3070 · i7-12700 · 16GB RAM · 144Hz 1080p',  hourlyRate: 100, position: 2 },
    { name: 'Console Zone',  description: 'PS5 + Xbox Series X dual console setup',     specs: 'PS5 + Xbox Series X · 65" 4K OLED · Surround',  hourlyRate: 120, position: 3 },
  ];

  for (const s of stations) {
    await prisma.station.upsert({
      where:  { id: s.name },  // won't match, will always create
      update: {},
      create: s,
    }).catch(() => {
      // Already exists — skip
    });
  }

  // Use findFirst to avoid duplicates on re-seed
  const existing = await prisma.station.count();
  if (existing === 0) {
    await prisma.station.createMany({ data: stations });
    console.log('✅ Sample stations created');
  } else {
    console.log(`✅ Stations already exist (${existing} found)`);
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
