import { z } from 'zod';

export const hotelSearchSchema = z.object({
  query: z.object({
    destination: z.string().optional(),
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
    guests: z.coerce.number().min(1).default(1).optional(),
    rooms: z.coerce.number().min(1).default(1).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    starRating: z.coerce.number().min(1).max(5).optional(),
    amenity: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating_desc', 'popularity']).default('popularity').optional(),
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(50).default(10).optional(),
  }),
});

export const hotelCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Hotel name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    address: z.string().min(3, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    country: z.string().min(2, 'Country is required'),
    postalCode: z.string().min(2, 'Postal code is required'),
    phone: z.string().min(5, 'Phone number is required'),
    email: z.string().email('Invalid email address'),
    starRating: z.coerce.number().min(1).max(5).default(4),
    checkInTime: z.string().default('14:00'),
    checkOutTime: z.string().default('11:00'),
    cancellationPolicy: z.string().optional(),
    isPublished: z.boolean().default(true),
    amenityIds: z.array(z.string()).optional(),
  }),
});

export const hotelUpdateSchema = z.object({
  body: hotelCreateSchema.shape.body.partial(),
});
