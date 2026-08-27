import { faker } from '@faker-js/faker'
import * as bcrypt from 'bcrypt-ts'
import crypto from 'crypto'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../app.js'
import { resendEmailService } from '../../services/email/resendEmail.service.js'
import { prisma } from '../../db.js'

// Mock do serviço de e-mail para evitar envios reais
const sendPasswordResetEmailMock = resendEmailService.sendPasswordResetEmail as vi.Mock
vi.mock('../../services/email/resendEmail.service.js', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}))

describe('POST /auth/forgot-password e /auth/reset-password (Recuperação de Senha - RF-09)', () => {
  // Limpa o banco de dados antes de cada teste
  beforeEach(async () => {
    // Limpa tokens de reset primeiro (devido à relação foreign key)
    await prisma.passwordResetToken.deleteMany()
    // Limpa usuários
    await prisma.user.deleteMany()
    // Resetar todos os mocks
    vi.clearAllMocks()
  })

  // Limpa após cada teste também para garantir isolamento
  afterEach(async () => {
    await prisma.passwordResetToken.deleteMany()
    await prisma.user.deleteMany()
  })

  const GENERIC_FORGOT_MESSAGE =
    'Se o e-mail informado estiver cadastrado, você receberá um link de redefinição em instantes.'
  const INVALID_TOKEN_MESSAGE = 'Token inválido ou expirado. Solicite uma nova redefinição.'
  const SUCCESS_RESET_MESSAGE = 'Senha redefinida com sucesso. Faça login com a nova senha'

  describe('POST /auth/forgot-password', () => {
    it('deve retornar mensagem genérica 200 para e-mail existente (RN-AUTH-15)', async () => {
      // Arrange: Cria um usuário LOCAL válido no banco
      const userEmail = faker.internet.email()
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('SenhaAntiga123!', 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      // Act
      const response = await request(app).post('/auth/forgot-password').send({ email: userEmail })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.message).toBe(GENERIC_FORGOT_MESSAGE)
      // Verifica que o serviço de e-mail foi chamado
      expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1)
      // Verifica que um token foi criado no banco
      const tokens = await prisma.passwordResetToken.findMany({
        where: { user: { email: userEmail } },
      })
      expect(tokens).toHaveLength(1)
    })

    it('deve retornar mesma mensagem genérica 200 para e-mail não existente (anti-enumeração - RN-AUTH-15)', async () => {
      // Arrange: Nenhum usuário criado, e-mail aleatório
      const nonExistentEmail = faker.internet.email()

      // Act
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: nonExistentEmail })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.message).toBe(GENERIC_FORGOT_MESSAGE)
      // Verifica que o serviço de e-mail NÃO foi chamado
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled()
      // Nenhum token criado
      const tokens = await prisma.passwordResetToken.findMany()
      expect(tokens).toHaveLength(0)
    })

    it('deve retornar mensagem genérica mas NÃO enviar e-mail para contas GOOGLE (RF-57)', async () => {
      // Arrange: Cria um usuário GOOGLE
      const googleEmail = faker.internet.email()
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: googleEmail,
          password: null, // Contas GOOGLE não tem senha local
          provider: 'GOOGLE',
          providerId: faker.string.uuid(),
          emailVerified: true,
        },
      })

      // Act
      const response = await request(app).post('/auth/forgot-password').send({ email: googleEmail })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.message).toBe(GENERIC_FORGOT_MESSAGE)
      // NÃO envia e-mail para contas GOOGLE
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled()
      // Nenhum token criado
      const tokens = await prisma.passwordResetToken.findMany()
      expect(tokens.length).toBe(0)
    })

    it('deve invalidar token anterior ao solicitar nova recuperação para o mesmo usuário (RN-AUTH-14)', async () => {
      // Arrange: Cria usuário e primeiro token
      const userEmail = faker.internet.email()
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('Senha123!', 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      // Cria primeiro token manualmente (simulando primeira solicitação)
      const firstToken = crypto.randomBytes(32).toString('hex')
      const firstTokenHash = crypto.createHash('sha256').update(firstToken).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: firstTokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30min
        },
      })

      // Act: Solicita nova recuperação de senha
      const response = await request(app).post('/auth/forgot-password').send({ email: userEmail })

      // Assert
      expect(response.status).toBe(200)
      // Verifica que apenas um token está ativo (o novo), o anterior foi invalidado (excluído/marcado)
      const allTokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } })
      expect(allTokens).toHaveLength(1) // Apenas o novo token existe
      // Verifica que o serviço de e-mail foi chamado para o novo token
      expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('POST /auth/reset-password', () => {
    it('deve redefinir senha com sucesso para token válido e senha compatível com política', async () => {
      // Arrange: Cria usuário e gera token válido
      const userEmail = faker.internet.email()
      const oldPassword = 'SenhaAntiga123!'
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash(oldPassword, 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      // Gera token real (como o serviço faria)
      const plainToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Válido por 30min
        },
      })

      const newValidPassword = 'NovaSenha123!' // Cumpre a política: 9+ chars, número, especial, maiúscula

      // Act
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: plainToken, newPassword: newValidPassword })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.message).toBe(SUCCESS_RESET_MESSAGE)

      // Verifica que a senha foi atualizada no banco
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      const passwordChanged = await bcrypt.compare(newValidPassword, updatedUser!.passwordHash)
      expect(passwordChanged).toBe(true)

      // Verifica que o token foi marcado como usado (usedAt preenchido)
      const usedToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
      expect(usedToken?.usedAt).not.toBeNull()
    })

    it('deve rejeitar token já utilizado (RN-AUTH-14)', async () => {
      // Arrange: Cria usuário, token que já foi usado
      const userEmail = faker.internet.email()
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('Senha123!', 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      const plainToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          usedAt: new Date(Date.now() - 10 * 60 * 1000), // Já foi usado há 10min
        },
      })

      const newPassword = 'NovaSenha456!'

      // Act: Tenta reutilizar o mesmo token
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: plainToken, newPassword: newPassword })

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.message).toBe(INVALID_TOKEN_MESSAGE)
      // Senha não foi alterada
      const currentUser = await prisma.user.findUnique({ where: { id: user.id } })
      const passwordStillOld = await bcrypt.compare('Senha123!', currentUser!.passwordHash)
      expect(passwordStillOld).toBe(true)
    })

    it('deve rejeitar token expirado (RN-AUTH-14)', async () => {
      // Arrange: Cria usuário com token expirado
      const userEmail = faker.internet.email()
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('Senha123!', 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      const plainToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expirado há 1hora
        },
      })

      const newPassword = 'NovaSenha456!'

      // Act
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: plainToken, newPassword: newPassword })

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.message).toBe(INVALID_TOKEN_MESSAGE)
    })

    it('deve rejeitar token inválido/inexistente', async () => {
      // Arrange: Nenhum token criado, token aleatório
      const invalidToken = crypto.randomBytes(32).toString('hex')
      const newPassword = 'NovaSenha456!'

      // Act
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: invalidToken, newPassword: newPassword })

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.message).toBe(INVALID_TOKEN_MESSAGE)
    })

    it('deve rejeitar senha que não cumpre a política (RN-CRYPT-04)', async () => {
      // Arrange: Cria usuário e token válido, mas senha fraca
      const userEmail = faker.internet.email()
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('Senha123!', 10),
          provider: 'LOCAL',
          emailVerified: true,
        },
      })

      const plainToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })

      // Senha fraca: sem maiúscula, sem caractere especial, curta
      const weakPassword = 'senha123'

      // Act
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: plainToken, newPassword: weakPassword })

      // Assert: Zod retorna erro de validação (status 400)
      expect(response.status).toBe(400)
      // Verifica que há erros de validação da senha
      expect(response.body.errors).toBeDefined()
      // Senha não foi alterada
      const currentUser = await prisma.user.findUnique({ where: { id: user.id } })
      const passwordStillOld = await bcrypt.compare('Senha123!', currentUser!.password)
      expect(passwordStillOld).toBe(true)
    })
  })
})
