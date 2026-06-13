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
  const parsed = envSchema.parse(source);
  validateProductionEnv(parsed, source);
  return parsed;
}

export const env = loadEnv();

function validateProductionEnv(parsed: Env, source: NodeJS.ProcessEnv): void {
  if (parsed.NODE_ENV !== 'production') return;

  const issues: string[] = [];
  if (!sourceHasValue(source, 'DATABASE_URL')) issues.push('DATABASE_URL is required in production');
  if (isWeakSecret(parsed.SESSION_SECRET, 'dev-session-secret-change-me')) issues.push('SESSION_SECRET must be a strong production secret');
  if (isWeakSecret(parsed.ENCRYPTION_MASTER_KEY, 'dev-encryption-key-change-me')) issues.push('ENCRYPTION_MASTER_KEY must be a strong production secret');

  const origins = parsed.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.some(origin => origin === '*' || origin.startsWith('http://localhost'))) {
    issues.push('CORS_ORIGIN must be explicit production HTTPS origin(s)');
  }

  if (issues.length > 0) {
    throw new Error(`Invalid production environment: ${issues.join('; ')}`);
  }
}

function sourceHasValue(source: NodeJS.ProcessEnv, key: string): boolean {
  return typeof source[key] === 'string' && source[key]!.trim().length > 0;
}

function isWeakSecret(value: string, defaultValue: string): boolean {
  return value === defaultValue || value.length < 32;
}
