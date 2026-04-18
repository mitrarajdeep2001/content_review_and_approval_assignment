import { db } from './index.js';
import { users } from './schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUsers = [
    {
      name: 'Alex Morgan',
      email: 'alex@contentflow.io',
      password: hashedPassword,
      role: 'CREATOR' as const,
      avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=6d28d9&color=fff&size=64&bold=true',
    },
    {
      name: 'Jordan Lee',
      email: 'jordan@contentflow.io',
      password: hashedPassword,
      role: 'REVIEWER_L1' as const,
      avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=0284c7&color=fff&size=64&bold=true',
    },
    {
      name: 'Taylor Kim',
      email: 'taylor@contentflow.io',
      password: hashedPassword,
      role: 'REVIEWER_L2' as const,
      avatar: 'https://ui-avatars.com/api/?name=Taylor+Kim&background=0f766e&color=fff&size=64&bold=true',
    },
    {
      name: 'Sam Reader',
      email: 'sam@contentflow.io',
      password: hashedPassword,
      role: 'READER' as const,
      avatar: 'https://ui-avatars.com/api/?name=Sam+Reader&background=14b8a6&color=fff&size=64&bold=true',
    },
  ];

  try {
    for (const user of demoUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
      console.log(`✅ Seeded user: ${user.email}`);
    }
    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
