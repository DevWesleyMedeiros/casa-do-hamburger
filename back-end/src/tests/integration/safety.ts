import { afterAll, vi } from 'vitest';
import { getTestDatabaseUrl } from '../../shared/utils/testDatabaseSafety.js';

// Todos os arquivos de integração importam esta entrada; db.ts também impõe a guarda.
getTestDatabaseUrl();

vi.mock('../../services/email/resendEmail.service.js', () => ({
  resendEmailService: {
    sendGenericEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../../config/firebaseAdmin.js', () => ({ verifyFirebaseIdToken: vi.fn() }));
vi.mock('../../services/uploads/cloudinary.service.js', () => ({
  uploadImageToCloudinary: vi.fn().mockRejectedValue(new Error('UPLOAD_MOCK_ONLY')),
}));

afterAll(async () => {
  const { prisma } = await import('../../db.js');
  await prisma.$disconnect();
});
