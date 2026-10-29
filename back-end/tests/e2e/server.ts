import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import type { UploadApiOptions, UploadApiResponse, UploadResponseCallback } from 'cloudinary';
import { getTestDatabaseUrl } from '../../src/shared/utils/testDatabaseSafety.js';

// Launcher exclusivo de testes, fora do build e sem endpoint de seed/bypass.
getTestDatabaseUrl();
const { resendEmailService } = await import('../../src/services/email/resendEmail.service.js');
resendEmailService.sendGenericEmail = async () => {};
resendEmailService.sendPasswordResetEmail = async () => {};
// Substituir somente o provedor externo; validação binária, services, Prisma e sessão continuam reais.
const { v2: cloudinary } = await import('cloudinary');
cloudinary.uploader.upload_stream = (
  options?: UploadApiOptions | UploadResponseCallback,
  callback?: UploadResponseCallback,
) => {
  const done = typeof options === 'function' ? options : callback;
  const stream = new Writable({
    write(_chunk, _encoding, next) {
      next();
    },
  });
  stream.on('finish', () =>
    done?.(undefined, {
      secure_url: 'https://example.invalid/rf45-test.png',
      public_id: `rf45-synthetic-${randomUUID()}`,
    } as UploadApiResponse),
  );
  return stream as unknown as ReturnType<typeof cloudinary.uploader.upload_stream>;
};
const { app } = await import('../../src/app.js');
const { prisma } = await import('../../src/db.js');
await prisma.$connect();
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
const server = app.listen(3000, '127.0.0.1');
const stop = () => {
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
