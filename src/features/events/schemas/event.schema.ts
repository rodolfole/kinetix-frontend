import { z } from 'zod';

export const eventDistanceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  distanceKm: z.number().positive(),
  priceModifier: z.number(),
  availableSlots: z.number().optional(),
  registered: z.number().optional(),
});

export const eventLocationSchema = z.object({
  city: z.string().min(1),
  venue: z.string().min(1),
  address: z.string().min(1),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const eventOrganizerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  logo: z.string().url().optional(),
});

export const eventPricingSchema = z.object({
  basePrice: z.number().positive(),
  currency: z.string().length(3),
  earlyBirdDiscount: z.number().optional(),
  earlyBirdDeadline: z.string().datetime().optional(),
});

export const eventImagesSchema = z.object({
  hero: z.string().url(),
  gallery: z.array(z.string().url()).optional(),
});

export const eventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  shortDescription: z.string().min(10).max(200),
  date: z.string().datetime(),
  location: eventLocationSchema,
  organizer: eventOrganizerSchema,
  distances: z.array(eventDistanceSchema).min(1),
  pricing: eventPricingSchema,
  images: eventImagesSchema,
  capacity: z.number().positive().optional(),
  registered: z.number().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']),
  featured: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const eventFilterSchema = z.object({
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  distance: z.number().positive().optional(),
  location: z.string().optional(),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});