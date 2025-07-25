import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create approved users
  const approvedUsers = [
    {
      email: 'kb@urbanit.com',
      role: 'USER',
      permission: 'WRITE'
    },
    {
      email: 'kt@urbanit.com',
      role: 'USER',
      permission: 'WRITE'
    },
    {
      email: 'readonly@urbanit.com',
      role: 'USER',
      permission: 'READ'
    }
    {
      email: 'dc@urbanit.com',
      role: 'USER',
      permission: 'READ'
    }
  ];

  for (const approvedUser of approvedUsers) {
    await prisma.approvedUser.upsert({
      where: { email: approvedUser.email },
      update: {},
      create: approvedUser
    });
  }

  console.log('✅ Approved users created');

  // Create actual users
  const users = [
    {
      name: 'kb@ Smith',
      email: 'kb@urbanit.com',
      password: await bcrypt.hash('password', 12),
      role: 'ADMIN',
      permission: 'WRITE',
      isWhitelisted: true
    },
    {
      name: 'Jane Doe',
      email: 'kt@urbanit.com',
      password: await bcrypt.hash('password', 12),
      role: 'USER',
      permission: 'WRITE',
      isWhitelisted: true
    },
    {
      name: 'Mike Johnson',
      email: 'readonly@urbanit.com',
      password: await bcrypt.hash('password', 12),
      role: 'USER',
      permission: 'READ',
      isWhitelisted: true
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
    createdUsers.push(createdUser);
  }

  console.log('✅ Users created');

  // Create sample transactions
  const transactions = [
    {
      userId: createdUsers[0].id, // John Smith
      type: 'INCOME',
      amount: 500,
      category: 'Training',
      description: 'Python course',
      date: new Date('2025-07-18')
    },
    {
      userId: createdUsers[0].id, // John Smith
      type: 'INCOME',
      amount: 800,
      category: 'Training',
      description: 'Javascript course',
      date: new Date('2025-07-18')
    },
    {
      userId: createdUsers[1].id, // Jane Doe
      type: 'EXPENDITURE',
      amount: 200,
      category: 'Utilities',
      description: 'Water Bills',
      date: new Date('2025-07-18')
    },
    {
      userId: createdUsers[0].id, // John Smith
      type: 'EXPENDITURE',
      amount: 190,
      category: 'Consulting',
      description: 'Electricity bills',
      date: new Date('2025-07-18')
    }
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: transaction
    });
  }

  console.log('✅ Sample transactions created');
  console.log('🎉 Database seeded successfully!');
  
  console.log('\n📋 Demo Credentials:');
  console.log('Admin: kb@urbanit.com / password');
  console.log('User: kt@urbanit.com / password');
  console.log('Read-only: readonly@urbanit.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });