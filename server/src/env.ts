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
