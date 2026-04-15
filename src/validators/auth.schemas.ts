import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize.js';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be between 2 and 50 characters.')
    .max(50, 'Name must be between 2 and 50 characters.')
    .transform((value) => sanitizeString(value) as string),
  email: z.string().trim().email('Please provide a valid email address.').transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must include at least one number.')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address.').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required.')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

