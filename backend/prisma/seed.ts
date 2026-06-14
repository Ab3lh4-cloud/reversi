import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const avatars = [
  { code: 'avatar_01', name: 'Avatar 1', assetKey: 'avatars/avatar_01.png', sortOrder: 1 },
  { code: 'avatar_02', name: 'Avatar 2', assetKey: 'avatars/avatar_02.png', sortOrder: 2 },
  { code: 'avatar_03', name: 'Avatar 3', assetKey: 'avatars/avatar_03.png', sortOrder: 3 },
  { code: 'avatar_04', name: 'Avatar 4', assetKey: 'avatars/avatar_04.png', sortOrder: 4 },
];

async function main() {
  console.log('Seeding avatars...');

  const keepCodes = avatars.map((a) => a.code);
  await prisma.avatar.deleteMany({
    where: { code: { notIn: keepCodes } },
  });

  for (const avatar of avatars) {
    await prisma.avatar.upsert({
      where: { code: avatar.code },
      update: avatar,
      create: avatar,
    });
  }

  console.log(`Seeded ${avatars.length} avatars`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
