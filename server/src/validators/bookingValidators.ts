import { z } from 'zod';

export const checkAvailabilitySchema = z.object({
  query: z.object({
    hotelId: z.string().min(1, 'Hotel ID is required'),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    guests: z.coerce.number().min(1).default(1).optional(),
    rooms: z.coerce.number().min(1).default(1).optional(),
  }),
});

export const calculatePriceSchema = z.object({
  body: z.object({
    hotelId: z.string().min(1, 'Hotel ID is required'),
    roomTypeId: z.string().min(1, 'Room Type ID is required'),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    roomQuantity: z.number().int().min(1).default(1),
    couponCode: z.string().optional(),
  }),
});

const guestInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').trim(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
});

export const createBookingHoldSchema = z.object({
  body: z.object({
    hotelId: z.string().min(1, 'Hotel ID is required'),
    roomTypeId: z.string().min(1, 'Room Type ID is required'),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    roomQuantity: z.number().int().min(1).default(1),
    numAdults: z.number().int().min(1).default(1),
    numChildren: z.number().int().min(0).default(0),
    couponCode: z.string().optional(),
    specialRequests: z.string().max(500).optional(),
    guests: z.array(guestInfoSchema).min(1, 'At least one primary guest is required'),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    cancellationReason: z.string().min(3, 'Cancellation reason is required').max(300),
  }),
});
