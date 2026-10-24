const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const userCount = await prisma.user.count();
    console.log('PRISMA CONNECTED! User count:', userCount);
    const categories = await prisma.category.findMany();
    console.log('Categories count:', categories.length, categories.map(c => c.name));
    const itemCount = await prisma.menuItem.count();
    console.log('Menu items count:', itemCount);
  } catch (err) {
    console.error('Prisma connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
