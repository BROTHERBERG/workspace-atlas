const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const achievements = [
  {
    id: 'first-visit',
    name: 'First Steps',
    description: 'Visit your first coworking space',
    category: 'EXPLORATION',
    icon: '🚀',
    experiencePoints: 100,
    requirement: 'Visit 1 workspace'
  },
  {
    id: 'city-explorer',
    name: 'City Explorer',
    description: 'Visit workspaces in 5 different cities',
    category: 'EXPLORATION', 
    icon: '🏙️',
    experiencePoints: 500,
    requirement: 'Visit workspaces in 5 cities'
  },
  {
    id: 'globe-trotter',
    name: 'Globe Trotter',
    description: 'Visit workspaces in 3 different countries',
    category: 'EXPLORATION',
    icon: '🌍',
    experiencePoints: 750,
    requirement: 'Visit workspaces in 3 countries'
  },
  {
    id: 'first-review',
    name: 'Reviewer',
    description: 'Write your first workspace review',
    category: 'COMMUNITY',
    icon: '⭐',
    experiencePoints: 50,
    requirement: 'Write 1 review'
  },
  {
    id: 'helpful-reviewer',
    name: 'Helpful Reviewer',
    description: 'Write 10 workspace reviews',
    category: 'COMMUNITY',
    icon: '📝',
    experiencePoints: 250,
    requirement: 'Write 10 reviews'
  },
  {
    id: 'social-connector',
    name: 'Social Connector',
    description: 'Connect with other nomads through reviews and interactions',
    category: 'SOCIAL',
    icon: '🤝',
    experiencePoints: 300,
    requirement: 'Interact with community'
  },
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Join the Haven Passport program in its first year',
    category: 'MILESTONE',
    icon: '🏆',
    experiencePoints: 200,
    requirement: 'Join before 2025'
  },
  {
    id: 'workspace-veteran',
    name: 'Workspace Veteran',
    description: 'Visit 25 different workspaces',
    category: 'EXPLORATION',
    icon: '🎖️',
    experiencePoints: 1000,
    requirement: 'Visit 25 workspaces'
  },
  {
    id: 'five-star-contributor',
    name: 'Five Star Contributor',
    description: 'Receive 10 helpful votes on your reviews',
    category: 'COMMUNITY',
    icon: '🌟',
    experiencePoints: 400,
    requirement: '10 helpful votes on reviews'
  },
  {
    id: 'nomad-influencer',
    name: 'Nomad Influencer',
    description: 'Refer 5 friends to join Haven Passport',
    category: 'SOCIAL',
    icon: '📢',
    experiencePoints: 500,
    requirement: 'Refer 5 friends'
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Work from a coworking space every weekend for a month',
    category: 'DEDICATION',
    icon: '⚡',
    experiencePoints: 300,
    requirement: 'Weekend visits for 1 month'
  },
  {
    id: 'loyalty-champion',
    name: 'Loyalty Champion',
    description: 'Visit the same workspace 10 times',
    category: 'DEDICATION',
    icon: '💎',
    experiencePoints: 350,
    requirement: 'Visit same workspace 10 times'
  }
];

async function seedAchievements() {
  console.log('🌱 Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
    console.log(`✅ Created/Updated achievement: ${achievement.name}`);
  }

  console.log('🎉 Achievement seeding completed!');
}

seedAchievements()
  .catch((e) => {
    console.error('❌ Error seeding achievements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });