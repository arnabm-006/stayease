import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory first, fallback to root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  API_BASE_URL: z.string().default('http://localhost:5000/api'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('stayease_secure_cookie_secret_key_32_chars_min'),
  
  // Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_placeholder_key_id'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('rzp_test_placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('rzp_webhook_secret_key'),
  
  // Media Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('stayease-demo'),
  CLOUDINARY_API_KEY: z.string().optional().default('123456789012345'),
  CLOUDINARY_API_SECRET: z.string().optional().default('your_cloudinary_api_secret'),
  
  // Email / SMTP
  SMTP_HOST: z.string().optional().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().optional().default(2525),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('StayEase Reservations <reservations@stayease.com>'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
