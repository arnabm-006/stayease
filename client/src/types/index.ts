export type Role = 'CUSTOMER' | 'RECEPTIONIST' | 'HOTEL_MANAGER' | 'SUPER_ADMIN';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
  hotelId?: string | null;
  assignedHotel?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
  category: string;
  description?: string | null;
}

export interface HotelImage {
  id: string;
  url: string;
  caption?: string | null;
  isCover: boolean;
  order: number;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  basePrice: number | string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedConfig: string;
  roomSizeSqFt: number;
  imageUrl?: string | null;
  rooms?: Room[];
}

export interface Room {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomType?: RoomType;
  hotel?: { name: string };
}

export interface Review {
  id: string;
  hotelId: string;
  bookingId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  staffRating: number;
  cleanlinessRating: number;
  comfortRating: number;
  locationRating: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  email: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  isPublished: boolean;
  startingPrice?: number;
  coverImage?: string;
  images: HotelImage[];
  amenities: Amenity[];
  roomTypes: RoomType[];
  reviews: Review[];
  reviewCount?: number;
  averageRating?: number;
  availableRoomCount?: number | null;
}

export interface BookingRoom {
  id: string;
  roomTypeId: string;
  roomId?: string | null;
  nightlyRateSnapshot: number | string;
  guestName?: string | null;
  roomType?: RoomType;
  room?: Room | null;
}

export interface Guest {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
  identificationType?: string;
  identificationNumber?: string;
}

export interface Payment {
  id: string;
  orderReference: string;
  transactionReference?: string | null;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  paymentProvider: string;
  paidAt?: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingReference: string;
    hotel?: { name: string; city: string };
  };
}

export interface Booking {
  id: string;
  bookingReference: string;
  customerId: string;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  numAdults: number;
  numChildren: number;
  totalNights: number;
  status: BookingStatus;
  holdExpiresAt?: string | null;
  baseTotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  serviceFeeTotal: number | string;
  grandTotal: number | string;
  currency: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancellationFee?: number | string | null;
  specialRequests?: string | null;
  createdAt: string;
  hotel: Hotel;
  bookingRooms: BookingRoom[];
  guests: Guest[];
  payments: Payment[];
  review?: Review | null;
}

export interface PricingBreakdown {
  nightlyRate: number;
  totalNights: number;
  roomQuantity: number;
  baseTotal: number;
  discountTotal: number;
  taxTotal: number;
  serviceFeeTotal: number;
  grandTotal: number;
  currency: string;
  appliedCoupon?: {
    id: string;
    code: string;
    description: string;
    discountValue: number;
    discountType: string;
  } | null;
}

export interface DashboardMetrics {
  totalBookings: number;
  todayArrivals: number;
  todayDepartures: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  confirmedRevenue: number;
  cancelledCount: number;
  paymentFailures: number;
}
