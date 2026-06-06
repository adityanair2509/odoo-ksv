import 'dotenv/config'
import { z } from 'zod'

/**
 * Zod-validated environment loader. Fails fast on startup if a required
 * variable is missing or malformed, instead of crashing mid-request.
 */
const EnvSchema = z.object({
    PORT: z
        .string()
        .default('8000')
        .transform((v) => Number(v))
        .pipe(z.number().int().positive()),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    ALLOWED_ORIGINS: z
        .string()
        .default('http://localhost:5173,http://localhost:3000')
        .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Email (optional — OTP/notifications log to console when unset)
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z
        .string()
        .default('465')
        .transform((v) => Number(v))
        .pipe(z.number().int().positive()),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM_NAME: z.string().default('VendorBridge'),
    APP_URL: z.string().default('http://localhost:5173'),
    OTP_LENGTH: z
        .string()
        .default('6')
        .transform((v) => Number(v))
        .pipe(z.number().int().min(4).max(8)),
    OTP_EXPIRY_MINUTES: z
        .string()
        .default('10')
        .transform((v) => Number(v))
        .pipe(z.number().int().positive()),
    // PostgreSQL (optional — schema in server/database/)
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z
        .string()
        .default('5432')
        .transform((v) => Number(v))
        .pipe(z.number().int().positive()),
    DB_NAME: z.string().default('vendorbridge'),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:')
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
}

export const env = parsed.data
