import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['USER', 'ENGINEER', 'EXPERT', 'ADMIN']).optional(),
  }),
});

export const expertRegisterSchema = z.object({
  body: z.object({
    // Basic Info
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    
    // Professional Details
    expertType: z.enum(['STRUCTURAL_ENGINEER', 'ARCHITECT', 'CIVIL_ENGINEER', 'GEOTECHNICAL_ENGINEER']),
    experience: z.enum(['5-10', '10-15', '15-20', '20+']),
    location: z.string().min(2, 'Location is required'),
    licenseNumber: z.string().min(5, 'License number is required'),
    
    // Specializations
    specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
    summary: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});
