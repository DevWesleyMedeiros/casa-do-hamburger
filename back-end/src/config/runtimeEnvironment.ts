import { z } from 'zod';

function hasProtocol(value: string, protocols: readonly string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const httpUrl = z.url().refine((value) => hasProtocol(value, ['http:', 'https:']));
const runtimeSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.url().refine((value) => hasProtocol(value, ['postgres:', 'postgresql:'])),
    JWT_SECRET: z.string().refine((value) => new TextEncoder().encode(value).length >= 32),
    FRONTEND_URL: httpUrl,
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.email(),
    FIREBASE_PRIVATE_KEY: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
  })
  .superRefine((environment, context) => {
    if (!hasProtocol(environment.FRONTEND_URL, ['http:', 'https:'])) return;
    const frontend = new URL(environment.FRONTEND_URL);
    if (
      frontend.username ||
      frontend.password ||
      frontend.search ||
      frontend.hash ||
      frontend.pathname !== '/'
    ) {
      context.addIssue({ code: 'custom', path: ['FRONTEND_URL'], message: 'Use somente a origem' });
    }
    if (environment.NODE_ENV === 'production' && frontend.protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        path: ['FRONTEND_URL'],
        message: 'HTTPS obrigatório em produção',
      });
    }
  });

export function validateRuntimeEnvironment(environment: NodeJS.ProcessEnv): void {
  const result = runtimeSchema.safeParse(environment);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))].join(', ');
    throw new Error(`Variáveis de ambiente inválidas: ${fields}`);
  }
}
