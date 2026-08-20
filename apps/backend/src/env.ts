import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('./data/sync-canvas.db'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}
