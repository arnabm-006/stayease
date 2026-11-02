import { PrismaClient, Role, RoomStatus, BookingStatus, PaymentStatus, DiscountType, MaintenancePriority, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StayEase database seeding...');

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.bookingCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.bookingRoom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomRate.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.hotelAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.hotelImage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();

  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // 1. Create Super Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@stayease.com',
      passwordHash: adminPassword,
      firstName: 'Eleanor',
      lastName: 'Vance',
      role: Role.SUPER_ADMIN,
      phone: '+1 (555) 019-2831',
      isActive: true,
    },
  });

  // 2. Create Amenities
  const amenitiesData = [
    { name: 'High-speed Wi-Fi', icon: 'Wifi', category: 'Connectivity', description: 'Complimentary fiber optic internet throughout the property' },
    { name: 'Heated Infinity Pool', icon: 'Waves', category: 'Wellness', description: 'Panoramic heated pool with cabana service' },
    { name: 'Spa & Wellness Sanctuary', icon: 'Sparkles', category: 'Wellness', description: 'Full-service spa offering holistic treatments & sauna' },
    { name: 'Michelin-starred Dining', icon: 'Utensils', category: 'Dining', description: 'World-class culinary dining curated by master chefs' },
    { name: 'Oceanview Balcony', icon: 'Sun', category: 'Room', description: 'Private spacious terrace with panoramic scenic views' },
    { name: 'Valet Parking', icon: 'Car', category: 'Services', description: '24/7 dedicated valet parking and EV charging stations' },
    { name: 'Concierge Service', icon: 'Bell', category: 'Services', description: 'Bespoke itinerary planning and reservations assistance' },
    { name: 'State-of-the-Art Fitness', icon: 'Dumbbell', category: 'Wellness', description: 'Technogym equipment, yoga studio, and personal trainers' },
    { name: '24/7 In-Room Dining', icon: 'Coffee', category: 'Dining', description: 'Artisanal dishes and fine beverages delivered anytime' },
    { name: 'Airport Chauffeur', icon: 'Shield', category: 'Services', description: 'Complimentary luxury executive airport transfer' },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) => prisma.amenity.create({ data: a }))
  );

  // 3. Create Hotels
  // Hotel 1: Grand Azure Haven (Miami Beach)
  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'The Grand Azure Haven',
      slug: 'the-grand-azure-haven',
      description: 'An architectural marvel perched along the golden shores of Miami Beach. The Grand Azure Haven blends coastal modernism with unhurried tropical luxury, featuring ocean-facing private terraces and bespoke butler service.',
      address: '4401 Collins Avenue',
      city: 'Miami Beach',
      state: 'Florida',
      country: 'United States',
      postalCode: '33140',
      latitude: 25.8189,
      longitude: -80.1218,
      phone: '+1 (305) 555-0144',
      email: 'reservations.azure@stayease.com',
      starRating: 5,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 48 hours prior to arrival date.',
      isPublished: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
            caption: 'Grand Azure Facade & Coastal Promenade',
            isCover: true,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80',
            caption: 'Oceanfront Heated Infinity Pool at Sunset',
            isCover: false,
            order: 2,
          },
          {
            url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80',
            caption: 'The Azure Lounge & Palm Terrace',
            isCover: false,
            order: 3,
          },
        ],
      },
    },
  });

  // Hotel 2: Alpine Serenity Lodge & Spa (Aspen)
  const hotel2 = await prisma.hotel.create({
    data: {
      name: 'Alpine Serenity Lodge & Spa',
      slug: 'alpine-serenity-lodge-and-spa',
      description: 'A sanctuary tucked in the Colorado Rockies. Experience roaring stone fireplaces, cedar sauna grottos, and ski-in/ski-out access surrounded by majestic snow-capped peaks.',
      address: '715 S Aspen Mountain Rd',
      city: 'Aspen',
      state: 'Colorado',
      country: 'United States',
      postalCode: '81611',
      latitude: 39.1867,
      longitude: -106.8182,
      phone: '+1 (970) 555-0198',
      email: 'aspen.serenity@stayease.com',
      starRating: 5,
      checkInTime: '16:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 7 days prior to arrival date.',
      isPublished: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
            caption: 'Alpine Serenity Winter Panorama',
            isCover: true,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80',
            caption: 'The Grand Hearth & Timber Lounge',
            isCover: false,
            order: 2,
          },
        ],
      },
    },
  });

  // Hotel 3: Lumina Kyoto Heritage Retreat (Kyoto)
  const hotel3 = await prisma.hotel.create({
    data: {
      name: 'Lumina Kyoto Heritage Retreat',
      slug: 'lumina-kyoto-heritage-retreat',
      description: 'Harmonious traditional Japanese aesthetics meet refined contemporary craftsmanship. Set amidst tranquil bamboo gardens and historical teahouses in Higashiyama.',
      address: '347 Kiyomizu, Higashiyama-ku',
      city: 'Kyoto',
      state: 'Kyoto Prefecture',
      country: 'Japan',
      postalCode: '605-0862',
      latitude: 34.9949,
      longitude: 135.7850,
      phone: '+81 75-555-0182',
      email: 'kyoto.lumina@stayease.com',
      starRating: 5,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 3 days prior to check-in.',
      isPublished: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80',
            caption: 'Lumina Kyoto Pagoda View & Gardens',
            isCover: true,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=80',
            caption: 'Tranquil Bamboo Courtyard & Onsen',
            isCover: false,
            order: 2,
          },
        ],
      },
    },
  });

  // Link Amenities to Hotels
  for (const amenity of amenities) {
    await prisma.hotelAmenity.create({ data: { hotelId: hotel1.id, amenityId: amenity.id } });
    await prisma.hotelAmenity.create({ data: { hotelId: hotel2.id, amenityId: amenity.id } });
    await prisma.hotelAmenity.create({ data: { hotelId: hotel3.id, amenityId: amenity.id } });
  }

  // 4. Create Staff & Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@stayease.com',
      passwordHash: managerPassword,
      firstName: 'Marcus',
      lastName: 'Sterling',
      role: Role.HOTEL_MANAGER,
      phone: '+1 (305) 555-0177',
      hotelId: hotel1.id,
      isActive: true,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'receptionist@stayease.com',
      passwordHash: staffPassword,
      firstName: 'Sophia',
      lastName: 'Chen',
      role: Role.RECEPTIONIST,
      phone: '+1 (305) 555-0188',
      hotelId: hotel1.id,
      isActive: true,
    },
  });

  // 5. Create Customer Demo Accounts
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@stayease.com',
      passwordHash: customerPassword,
      firstName: 'Julian',
      lastName: 'Montgomery',
      role: Role.CUSTOMER,
      phone: '+1 (415) 555-0129',
      isActive: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.CUSTOMER,
      phone: '+1 (212) 555-0143',
      isActive: true,
    },
  });

  // 6. Create Room Types & Rooms for Hotel 1 (The Grand Azure Haven)
  const roomType1_1 = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Deluxe Oceanfront Suite',
      description: 'Expansive oceanfront suite with floor-to-ceiling glass, private teak balcony, marble bathroom, and deep soaking tub.',
      basePrice: 420.00,
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 1,
      bedConfig: '1 King Bed + 1 Daybed',
      roomSizeSqFt: 620,
      imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const roomType1_2 = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Presidential Penthouse Villa',
      description: 'The pinnacle of Miami luxury with a private rooftop plunge pool, dedicated butler kitchen, and unobstructed Atlantic views.',
      basePrice: 950.00,
      maxOccupancy: 4,
      maxAdults: 3,
      maxChildren: 2,
      bedConfig: '2 King Beds',
      roomSizeSqFt: 1450,
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const roomType1_3 = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Superior Coastal King Room',
      description: 'Elegantly appointed guestroom featuring custom Italian linens, rainfall shower, and serene coastal views.',
      basePrice: 280.00,
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 0,
      bedConfig: '1 King Bed',
      roomSizeSqFt: 420,
      imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Create Physical Rooms for Hotel 1
  const roomsHotel1 = [
    { roomNumber: '101', floor: 1, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_3.id },
    { roomNumber: '102', floor: 1, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_3.id },
    { roomNumber: '201', floor: 2, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_1.id },
    { roomNumber: '202', floor: 2, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_1.id },
    { roomNumber: '203', floor: 2, status: RoomStatus.CLEANING, roomTypeId: roomType1_1.id },
    { roomNumber: '301', floor: 3, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_1.id },
    { roomNumber: 'PH-1', floor: 4, status: RoomStatus.AVAILABLE, roomTypeId: roomType1_2.id },
    { roomNumber: 'PH-2', floor: 4, status: RoomStatus.MAINTENANCE, roomTypeId: roomType1_2.id },
  ];

  for (const r of roomsHotel1) {
    await prisma.room.create({
      data: {
        hotelId: hotel1.id,
        ...r,
      },
    });
  }

  // Create Room Types for Hotel 2 (Aspen)
  const roomType2_1 = await prisma.roomType.create({
    data: {
      hotelId: hotel2.id,
      name: 'Alpine Chalet Suite',
      description: 'Charming timber-clad chalet suite with a natural stone hearth, steam shower, and private balcony facing the slopes.',
      basePrice: 480.00,
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 1,
      bedConfig: '1 King Bed + Sofa Bed',
      roomSizeSqFt: 750,
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const roomType2_2 = await prisma.roomType.create({
    data: {
      hotelId: hotel2.id,
      name: 'Summit King Grotto Room',
      description: 'Cozy rustic luxury with heated timber floors, artisan wool throws, and mountain views.',
      basePrice: 320.00,
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 0,
      bedConfig: '1 King Bed',
      roomSizeSqFt: 460,
      imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    },
  });

  for (let i = 1; i <= 4; i++) {
    await prisma.room.create({
      data: {
        hotelId: hotel2.id,
        roomTypeId: roomType2_1.id,
        roomNumber: `Chalet-${100 + i}`,
        floor: 1,
        status: RoomStatus.AVAILABLE,
      },
    });
    await prisma.room.create({
      data: {
        hotelId: hotel2.id,
        roomTypeId: roomType2_2.id,
        roomNumber: `Summit-${200 + i}`,
        floor: 2,
        status: RoomStatus.AVAILABLE,
      },
    });
  }

  // Room Types for Hotel 3 (Kyoto)
  const roomType3_1 = await prisma.roomType.create({
    data: {
      hotelId: hotel3.id,
      name: 'Zen Garden Villa with Private Onsen',
      description: 'Traditional tatami sitting room, cedar hot spring onsen bath, and private Japanese stone zen garden courtyard.',
      basePrice: 550.00,
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 0,
      bedConfig: '1 King Futon Suite',
      roomSizeSqFt: 820,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    },
  });

  for (let i = 1; i <= 4; i++) {
    await prisma.room.create({
      data: {
        hotelId: hotel3.id,
        roomTypeId: roomType3_1.id,
        roomNumber: `Zen-${i}`,
        floor: 1,
        status: RoomStatus.AVAILABLE,
      },
    });
  }

  // 7. Create Coupons
  const coupon1 = await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: '10% welcome discount for your first luxury stay',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.00,
      minBookingAmount: 100.00,
      maxDiscountAmount: 150.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 500,
      usedCount: 14,
      isActive: true,
    },
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      code: 'LUXURY50',
      description: '$50 instant credit on bookings over $300',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 50.00,
      minBookingAmount: 300.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 200,
      usedCount: 22,
      isActive: true,
    },
  });

  // 8. Create Sample Past Booking and Confirmed Upcoming Booking
  // Past Booking (Completed with Review)
  const pastCheckIn = new Date('2026-09-10');
  const pastCheckOut = new Date('2026-09-13');
  const pastBooking = await prisma.booking.create({
    data: {
      bookingReference: 'SE-202609-PAST1',
      customerId: customer1.id,
      hotelId: hotel1.id,
      checkInDate: pastCheckIn,
      checkOutDate: pastCheckOut,
      numAdults: 2,
      numChildren: 0,
      totalNights: 3,
      status: BookingStatus.CHECKED_OUT,
      baseTotal: 1260.00,
      discountTotal: 50.00,
      taxTotal: 145.20,
      serviceFeeTotal: 40.00,
      grandTotal: 1395.20,
      currency: 'USD',
      specialRequests: 'High floor, quiet corner preferred.',
      guests: {
        create: [
          {
            firstName: 'Julian',
            lastName: 'Montgomery',
            email: 'customer@stayease.com',
            phone: '+1 (415) 555-0129',
            isPrimary: true,
          },
        ],
      },
      bookingRooms: {
        create: [
          {
            roomTypeId: roomType1_1.id,
            nightlyRateSnapshot: 420.00,
            guestName: 'Julian Montgomery',
          },
        ],
      },
      payments: {
        create: [
          {
            orderReference: 'order_test_past_001',
            transactionReference: 'pay_test_past_001',
            amount: 1395.20,
            currency: 'USD',
            status: PaymentStatus.SUCCESS,
            method: 'card',
            paymentProvider: 'razorpay',
            paidAt: pastCheckIn,
          },
        ],
      },
    },
  });

  // Create Verified Review for Past Booking
  await prisma.review.create({
    data: {
      hotelId: hotel1.id,
      bookingId: pastBooking.id,
      userId: customer1.id,
      rating: 5,
      title: 'Unrivaled coastal serenity and exemplary hospitality',
      comment: 'From the private arrival check-in to the spectacular balcony vistas over the Atlantic, our three-night stay at The Grand Azure Haven was simply flawless. The oceanfront pool and in-room dining exceeded every expectation.',
      staffRating: 5,
      cleanlinessRating: 5,
      comfortRating: 5,
      locationRating: 5,
      isApproved: true,
    },
  });

  // Upcoming Confirmed Booking
  const upcomingCheckIn = new Date('2026-11-15');
  const upcomingCheckOut = new Date('2026-11-18');
  await prisma.booking.create({
    data: {
      bookingReference: 'SE-202611-UPC01',
      customerId: customer1.id,
      hotelId: hotel2.id,
      checkInDate: upcomingCheckIn,
      checkOutDate: upcomingCheckOut,
      numAdults: 2,
      numChildren: 0,
      totalNights: 3,
      status: BookingStatus.CONFIRMED,
      baseTotal: 1440.00,
      discountTotal: 144.00,
      taxTotal: 155.52,
      serviceFeeTotal: 45.00,
      grandTotal: 1496.52,
      currency: 'USD',
      specialRequests: 'Late arrival around 6 PM.',
      guests: {
        create: [
          {
            firstName: 'Julian',
            lastName: 'Montgomery',
            email: 'customer@stayease.com',
            phone: '+1 (415) 555-0129',
            isPrimary: true,
          },
        ],
      },
      bookingRooms: {
        create: [
          {
            roomTypeId: roomType2_1.id,
            nightlyRateSnapshot: 480.00,
            guestName: 'Julian Montgomery',
          },
        ],
      },
      payments: {
        create: [
          {
            orderReference: 'order_test_upc_001',
            transactionReference: 'pay_test_upc_001',
            amount: 1496.52,
            currency: 'USD',
            status: PaymentStatus.SUCCESS,
            method: 'card',
            paymentProvider: 'razorpay',
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  // 9. Create Favorites
  await prisma.favorite.create({
    data: {
      userId: customer1.id,
      hotelId: hotel1.id,
    },
  });
  await prisma.favorite.create({
    data: {
      userId: customer1.id,
      hotelId: hotel3.id,
    },
  });

  // 10. Create Maintenance record
  const maintenanceRoom = await prisma.room.findFirst({
    where: { roomNumber: 'PH-2' },
  });
  if (maintenanceRoom) {
    await prisma.maintenance.create({
      data: {
        roomId: maintenanceRoom.id,
        hotelId: hotel1.id,
        title: 'Penthouse Jacuzzi Deep Servicing',
        description: 'Quarterly filtration upgrade and pump calibration.',
        priority: MaintenancePriority.HIGH,
        status: MaintenanceStatus.IN_PROGRESS,
        startDate: new Date('2026-10-25'),
        endDate: new Date('2026-10-29'),
        cost: 650.00,
        createdBy: 'Marcus Sterling',
      },
    });
  }

  // 11. Create Notifications
  await prisma.notification.create({
    data: {
      userId: customer1.id,
      title: 'Booking Confirmed!',
      message: 'Your stay at Alpine Serenity Lodge & Spa (SE-202611-UPC01) is confirmed.',
      type: 'BOOKING',
      isRead: false,
    },
  });

  console.log('✅ StayEase database seed completed successfully!');
  console.log('📋 Seeded Demo Accounts:');
  console.log('  Customer:     customer@stayease.com   / Customer@123');
  console.log('  Receptionist: receptionist@stayease.com / Staff@123');
  console.log('  Hotel Manager:manager@stayease.com    / Manager@123');
  console.log('  Super Admin:  admin@stayease.com      / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
