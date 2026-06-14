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

  // Garante que os 4 novos avatares existam primeiro
  for (const avatar of avatars) {
    await prisma.avatar.upsert({
      where: { code: avatar.code },
      update: avatar,
      create: avatar,
    });
  }

  // Pega o id do avatar_01 para reatribuir sessões órfãs
  const fallback = await prisma.avatar.findUnique({ where: { code: 'avatar_01' } });
  const keepCodes = avatars.map((a) => a.code);

  if (fallback) {
    // Move sessões que apontam para avatares antigos para o avatar_01
    const oldAvatars = await prisma.avatar.findMany({
      where: { code: { notIn: keepCodes } },
      select: { id: true },
    });
    const oldIds = oldAvatars.map((a) => a.id);
    if (oldIds.length > 0) {
      await prisma.playerSession.updateMany({
        where: { avatarId: { in: oldIds } },
        data: { avatarId: fallback.id },
      });
    }
  }

  // Remove avatares antigos
  await prisma.avatar.deleteMany({
    where: { code: { notIn: keepCodes } },
  });

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
