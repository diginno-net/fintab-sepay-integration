import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/fintab_sepay'),
  SESSION_SECRET: z.string().min(16).default('dev-session-secret-change-me'),
  ENCRYPTION_MASTER_KEY: z.string().min(16).default('dev-encryption-key-change-me'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  JOBS_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000)
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}

export const env = loadEnv();
