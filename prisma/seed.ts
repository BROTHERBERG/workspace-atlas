import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@workscapeatlas.com' },
    update: {},
    create: {
      email: 'admin@workscapeatlas.com',
      name: 'Admin User',
      role: 'ADMIN',
      verified: true,
    },
  })

  console.log('✅ Created admin user')

  // Create sample space owners
  const spaceOwners = []
  for (let i = 0; i < 5; i++) {
    const owner = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: 'SPACE_OWNER',
        verified: true,
      },
    })
    spaceOwners.push(owner)
  }

  console.log('✅ Created space owners')

  // Create sample workspaces
  const cities = [
    { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
    { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
  ]

  const amenities = [
    'High-speed WiFi',
    'Coffee & Tea',
    'Meeting Rooms',
    'Phone Booths',
    'Printing',
    'Kitchen',
    '24/7 Access',
    'Parking',
    'Shower Facilities',
    'Event Space',
    'Bike Storage',
    'Lockers',
  ]

  for (const city of cities) {
    for (let i = 0; i < 3; i++) {
      const owner = faker.helpers.arrayElement(spaceOwners)
      const workspaceName = faker.company.name() + ' ' + faker.helpers.arrayElement(['Hub', 'Space', 'Works', 'Lab', 'Studio'])
      
      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: faker.lorem.paragraphs(2),
          status: 'ACTIVE',
          featured: faker.datatype.boolean(0.3),
          verified: faker.datatype.boolean(0.8),
          city: city.name,
          country: city.country,
          address: faker.location.streetAddress(),
          latitude: city.lat + faker.number.float({ min: -0.1, max: 0.1 }),
          longitude: city.lng + faker.number.float({ min: -0.1, max: 0.1 }),
          website: faker.internet.url(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          digitalScore: faker.number.int({ min: 60, max: 95 }),
          rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
          reviewCount: faker.number.int({ min: 5, max: 50 }),
          userId: owner.id,
        },
      })

      // Add amenities
      const workspaceAmenities = faker.helpers.arrayElements(amenities, { min: 5, max: 10 })
      for (const amenity of workspaceAmenities) {
        await prisma.workspaceAmenity.create({
          data: {
            workspaceId: workspace.id,
            amenity,
          },
        })
      }

      // Add images
      for (let j = 0; j < 5; j++) {
        await prisma.workspaceImage.create({
          data: {
            workspaceId: workspace.id,
            url: `https://picsum.photos/800/600?random=${workspace.id}-${j}`,
            alt: `${workspace.name} - Image ${j + 1}`,
            isMain: j === 0,
            order: j,
          },
        })
      }

      // Add pricing
      const pricingTypes = ['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM']
      for (const type of pricingTypes) {
        let price: number
        switch (type) {
          case 'HOT_DESK':
            price = faker.number.int({ min: 25, max: 50 })
            break
          case 'DEDICATED_DESK':
            price = faker.number.int({ min: 200, max: 400 })
            break
          case 'PRIVATE_OFFICE':
            price = faker.number.int({ min: 800, max: 2000 })
            break
          case 'MEETING_ROOM':
            price = faker.number.int({ min: 30, max: 100 })
            break
          default:
            price = 50
        }

        await prisma.workspacePricing.create({
          data: {
            workspaceId: workspace.id,
            type: type as any,
            price,
            currency: 'USD',
            description: `${type.replace('_', ' ').toLowerCase()} pricing`,
          },
        })
      }

      // Add workspace score
      await prisma.workspaceScore.create({
        data: {
          workspaceId: workspace.id,
          overallScore: workspace.digitalScore || 80,
          websiteScore: faker.number.int({ min: 70, max: 100 }),
          socialScore: faker.number.int({ min: 60, max: 95 }),
          reviewScore: faker.number.int({ min: 80, max: 100 }),
          presenceScore: faker.number.int({ min: 70, max: 95 }),
        },
      })

      console.log(`✅ Created workspace: ${workspace.name} in ${city.name}`)
    }
  }

  // Create sample users with Haven Passports
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: 'USER',
        verified: faker.datatype.boolean(0.8),
      },
    })

    // Create Haven Passport
    const passport = await prisma.havenPassport.create({
      data: {
        userId: user.id,
        tier: faker.helpers.arrayElement(['NOMAD', 'EXPLORER', 'PIONEER']),
        points: faker.number.int({ min: 0, max: 500 }),
        totalVisits: faker.number.int({ min: 0, max: 20 }),
      },
    })

    // Add some achievements
    const achievements = [
      { type: 'first_visit', title: 'First Steps', description: 'Made your first workspace visit' },
      { type: 'city_explorer', title: 'City Explorer', description: 'Visited 5 different cities' },
      { type: 'regular_visitor', title: 'Regular', description: 'Made 10 workspace visits' },
    ]

    for (const achievement of faker.helpers.arrayElements(achievements, { min: 1, max: 3 })) {
      await prisma.passportAchievement.create({
        data: {
          passportId: passport.id,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          pointsAwarded: faker.number.int({ min: 10, max: 50 }),
        },
      })
    }
  }

  console.log('✅ Created sample users with Haven Passports')

  // Create sample contact forms
  for (let i = 0; i < 10; i++) {
    await prisma.contactForm.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: faker.helpers.arrayElement([
          'General Inquiry',
          'Partnership Opportunity',
          'Technical Support',
          'Feedback',
        ]),
        message: faker.lorem.paragraphs(2),
        status: faker.helpers.arrayElement(['pending', 'responded', 'closed']),
      },
    })
  }

  console.log('✅ Created sample contact forms')

  // Create sample score requests
  for (let i = 0; i < 15; i++) {
    await prisma.scoreRequest.create({
      data: {
        email: faker.internet.email(),
        spaceName: faker.company.name() + ' Coworking',
        websiteUrl: faker.internet.url(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED']),
        score: faker.datatype.boolean(0.6) ? faker.number.int({ min: 60, max: 95 }) : null,
        feedback: faker.datatype.boolean(0.4) ? faker.lorem.paragraph() : null,
      },
    })
  }

  console.log('✅ Created sample score requests')
  console.log('🎉 Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })