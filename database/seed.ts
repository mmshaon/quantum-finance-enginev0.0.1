import { config } from 'dotenv';
import path from 'path';

// Load .env from project root (parent of database/)
config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CREATOR_EMAIL = process.env.CREATOR_EMAIL || 'creator@quantum-finance.local';
const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD || 'Creator@12345';

async function main() {
  console.log('🌱 Seeding database...');

  const creatorPasswordHash = await bcrypt.hash(CREATOR_PASSWORD, 10);

  const creator = await prisma.user.upsert({
    where: { email: CREATOR_EMAIL },
    update: {},
    create: {
      email: CREATOR_EMAIL,
      passwordHash: creatorPasswordHash,
      fullName: 'Mohammad Maynul Hasan',
      isApproved: true,
      isCreator: true,
    },
  });

  console.log('✅ Creator account:', creator.email);

  let companyId = creator.companyId;
  if (!companyId) {
    const company = await prisma.company.create({
      data: {
        name: 'Alpha Ultimate Ltd',
        email: 'info@alpha-ultimate.com',
        settings: {
          create: {
            language: 'en',
            currency: 'SAR',
            darkModeDefault: true,
          },
        },
      },
    });
    companyId = company.id;
    await prisma.user.update({
      where: { id: creator.id },
      data: { companyId },
    });
    console.log('✅ Default company:', company.name);
  }

  let creatorRole = await prisma.role.findFirst({ where: { name: 'Creator' } });
  if (!creatorRole) {
    creatorRole = await prisma.role.create({
      data: {
        name: 'Creator',
        description: 'System creator with full access',
        isSystem: true,
      },
    });
  }

  const existingUserRole = await prisma.userRole.findFirst({
    where: { userId: creator.id, roleId: creatorRole.id },
  });
  if (!existingUserRole) {
    await prisma.userRole.create({
      data: { userId: creator.id, roleId: creatorRole.id },
    });
  }

  console.log('✅ Default roles created');

  console.log('\n🎉 Seed complete!');
  console.log(`   Login: ${CREATOR_EMAIL}`);
  console.log(`   Password: ${CREATOR_PASSWORD}`);
  console.log('   ⚠️  Change password in production!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
