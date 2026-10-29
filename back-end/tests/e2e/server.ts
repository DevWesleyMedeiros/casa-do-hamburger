import { getTestDatabaseUrl } from '../../src/shared/utils/testDatabaseSafety.js';

// Launcher exclusivo de testes, fora do build e sem endpoint de seed/bypass.
getTestDatabaseUrl();
const { resendEmailService } = await import('../../src/services/email/resendEmail.service.js');
resendEmailService.sendGenericEmail = async () => {};
resendEmailService.sendPasswordResetEmail = async () => {};
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
