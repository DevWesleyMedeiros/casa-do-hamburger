import { faker } from '@faker-js/faker'
import * as bcrypt from 'bcrypt-ts'
import type { DecodedIdToken } from 'firebase-admin/auth'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock do Firebase Admin — nunca bate na rede de verdade em teste.
// Cada `it` controla o que verifyFirebaseIdToken resolve/rejeita, simulando exatamente as decisões de RN-AUTH-08/09/11 sem depender do Google.

/**
 * Fábrica de um payload decodificado de ID Token do Firebase (mock).
 * Simula o retorno de admin.auth().verifyIdToken() após o front enviar o idToken obtido no login com GoogleAuthProvider.
 *
 * Use `overrides` para forçar cenários de borda em cada teste,
 * ex.: { email_verified: false } para validar o gate da RN-AUTH-11.
 */

// mock precisa vir ANTES do import de app.js — Vitest faz hoisting automático de vi.mock() para o topo do arquivo, mas deixe explícito por clareza
vi.mock('../../config/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}))

// 2. IMPORTS EXECUTADOS SEQUENCIALMENTE APÓS O MOCK ESTAR SETUPADO
import { app } from '../../app.js'
import { verifyFirebaseIdToken } from '../../config/firebaseAdmin.js'
import { prisma } from '../../db.js'

const verifyFirebaseIdTokenMock = vi.mocked(verifyFirebaseIdToken)

// TODO(#47): reativar quando app.use(errorHandler) parar de receber undefined.
// madge --circular não aponta ciclo — investigar depois se é hoisting do vi.mock,
// export default/named mismatch, ou throw silencioso dentro de errorHandler.ts.
describe('Google Auth Integration', () => {
  describe('POST /auth/google (Login social — RF-51 a RF-55)', () => {
    const cleanupUsers = async () => {
      await prisma.cartItem.deleteMany()
      await prisma.orderItem.deleteMany()
      await prisma.order.deleteMany()
      await prisma.emailVerificationToken.deleteMany()
      await prisma.passwordResetToken.deleteMany()
      await prisma.user.deleteMany()
    }

    beforeEach(async () => {
      await cleanupUsers()
      vi.clearAllMocks()
    })

    afterEach(async () => {
      await cleanupUsers()
    })

    const fakeDecodedToken = (overrides: Partial<DecodedIdToken> = {}) => ({
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
      name: faker.person.fullName(),
      picture: faker.image.avatar(),
      firebase: { sign_in_provider: 'google.com', identities: {} },
      iss: 'https://securetoken.google.com/casa-do-hamburguer',
      aud: 'casa-do-hamburguer',
      sub: faker.string.uuid(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    })

    it('deve criar um novo usuário provider=GOOGLE quando o e-mail não existe (RF-53)', async () => {
      const decoded = fakeDecodedToken()
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded) // função que vai retornar o decoded token simulando um Firebase ID Token válido

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' })

      expect(response.status).toBe(200)
      expect(response.body.user.email).toBe(decoded.email)
      expect(response.body.user.password).toBeUndefined()

      const created = await prisma.user.findUnique({ where: { email: decoded.email } })
      expect(created?.provider).toBe('GOOGLE')
      expect(created?.password).toBeNull()
      expect(created?.firebaseUid).toBe(decoded.uid)

      const setCookie = response.headers['set-cookie']?.[0] ?? ''
      expect(setCookie).toContain('user_section=')
      expect(setCookie.toLowerCase()).toContain('httponly')
    })

    it('deve vincular automaticamente a uma conta LOCAL existente quando email_verified=true (RF-54)', async () => {
      const userEmail = faker.internet.email()
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('SenhaAntiga123!', 10),
          provider: 'LOCAL',
          cep: '00000-000',
        },
      })
      const decoded = fakeDecodedToken({ email: userEmail, email_verified: true })
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded)

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' })

      expect(response.status).toBe(200)
      const linked = await prisma.user.findUnique({ where: { email: userEmail } })
      expect(linked?.firebaseUid).toBe(decoded.uid)
      expect(linked?.provider).toBe('LOCAL')
    })

    it('NÃO deve vincular automaticamente quando email_verified=false (RN-AUTH-11 — segurança)', async () => {
      const userEmail = faker.internet.email()
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('SenhaAntiga123!', 10),
          provider: 'LOCAL',
          cep: '00000-000',
        },
      })
      const decoded = fakeDecodedToken({ email: userEmail, email_verified: false })
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded)

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' })

      // Complete o seu assert do terceiro caso de teste aqui
      expect(response.status).not.toBe(200)
    })
  })
})
