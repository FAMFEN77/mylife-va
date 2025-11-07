import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { PlanType, PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = 'rfenanlamber@gmail.com';
  const plainPassword = 'Welkom123!';

  // Hash wachtwoord
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      premium: true,
      role: UserRole.MANAGER,
      passwordHash,
      updatedAt: new Date(),
    },
    create: {
      id: randomUUID(),
      email,
      premium: true,
      role: UserRole.MANAGER,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const organisation = await prisma.organisation.upsert({
    where: { id: 'org1' },
    update: {
      name: 'Taskee Zorgteam',
      plan: PlanType.PRO,
      updatedAt: new Date(),
    },
    create: {
      id: 'org1',
      name: 'Taskee Zorgteam',
      plan: PlanType.PRO,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  if (user.organisationId !== organisation.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organisationId: organisation.id,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Manager user klaar: ${user.email}`);
  console.log(`✅ Organisatie gekoppeld: ${organisation.name} (${organisation.plan})`);
  console.log(`✅ Inloggen kan met wachtwoord: ${plainPassword}`);
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
