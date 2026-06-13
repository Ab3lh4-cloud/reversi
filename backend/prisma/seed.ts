import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const avatars = [
  { code: 'anime_boy_01', name: 'Anime Boy 01', assetKey: 'avatars/anime_boy_01.png', sortOrder: 1 },
  { code: 'anime_boy_02', name: 'Anime Boy 02', assetKey: 'avatars/anime_boy_02.png', sortOrder: 2 },
  { code: 'anime_girl_01', name: 'Anime Girl 01', assetKey: 'avatars/anime_girl_01.png', sortOrder: 3 },
  { code: 'anime_girl_02', name: 'Anime Girl 02', assetKey: 'avatars/anime_girl_02.png', sortOrder: 4 },
  { code: 'ninja_01', name: 'Ninja', assetKey: 'avatars/ninja_01.png', sortOrder: 5 },
  { code: 'mage_01', name: 'Mage', assetKey: 'avatars/mage_01.png', sortOrder: 6 },
  { code: 'warrior_01', name: 'Warrior', assetKey: 'avatars/warrior_01.png', sortOrder: 7 },
  { code: 'fox_01', name: 'Fox', assetKey: 'avatars/fox_01.png', sortOrder: 8 },
  { code: 'cat_01', name: 'Cat', assetKey: 'avatars/cat_01.png', sortOrder: 9 },
  { code: 'moon_01', name: 'Moon', assetKey: 'avatars/moon_01.png', sortOrder: 10 },
  { code: 'star_01', name: 'Star', assetKey: 'avatars/star_01.png', sortOrder: 11 },
  { code: 'samurai_01', name: 'Samurai', assetKey: 'avatars/samurai_01.png', sortOrder: 12 },
];

async function main() {
  console.log('Seeding avatars...');

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
