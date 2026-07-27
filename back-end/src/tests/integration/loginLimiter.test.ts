import { describe, expect, it, beforeEach } from 'vitest'
import request from 'supertest'
import { faker } from '@faker-js/faker'
import { app } from '../../app.js'
import {
  loginLimiterBroadStore,
  loginLimiterTargetedStore,
  registerLimiterBroadStore,
  registerLimiterTargetedStore,
} from '../../../src/middlewares/rateLimiter.js'

beforeEach(() => {
  // Garantia de estado zero (Isolamento total)
  loginLimiterBroadStore.resetAll()
  loginLimiterTargetedStore.resetAll()
  registerLimiterBroadStore.resetAll()
  registerLimiterTargetedStore.resetAll()
})

// teste para requisições dentro da janela e tentativas
describe('Rate limiter - POST /auth/login (RF-12 / RNF-06)', () => {
  it('deve permitir até 5 tentativas dentro da janela de 15 minutos', async () => {
    const email = faker.internet.email()
    for (let index = 0; index < 5; index++) {
      const response = await request(app)
        .post('/auth/login')
        .send({ email, password: 'senhaErrada123' })
      expect(response.status).not.toBe(429)
    }
  })

  // Testando o TARGETED (loginLimiter)
  it('deve bloquear (Targeted) com 429 a partir da 6ª tentativa para o MESMO e-mail', async () => {
    const email = faker.internet.email()

    // Esgota o limite do Targeted (5)
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({ email, password: 'x' })
    }
    const response = await request(app).post('/auth/login').send({ email, password: 'x' })

    expect(response.status).toBe(429)
    expect(response.body.error).toMatch(/este e-mail/i) // Garante que foi o Targeted que bloqueou
  })

  // Testando o BROAD (loginLimiter)
  it('deve bloquear (Broad) com 429 a partir da 21ª tentativa da mesma origem, com e-mails DIFERENTES', async () => {
    // Esgota o limite Broad (20), mas desvia do Targeted mudando o e-mail sempre
    for (let i = 0; i < 20; i++) {
      await request(app).post('/auth/login').send({ email: faker.internet.email(), password: 'x' }) // E-mail único a cada vez
    }

    const response = await request(app)
      .post('/auth/login')
      .send({ email: faker.internet.email(), password: 'x' })

    expect(response.status).toBe(429)
    expect(response.body.error).toMatch(/nesta origem/i) // Garante que foi o Broad que bloqueou
  })

  // validar se a aplicação expõe corretamente o consumo de requisições de forma padronizada
  it('deve incluir os headers RateLimit padronizados (draft-8)', async () => {
    const email = faker.internet.email()
    const response = await request(app).post('/auth/login').send({ email, password: 'x' })

    expect(response.headers['ratelimit']).toBeDefined()
    expect(response.headers['x-ratelimit-limit']).toBeUndefined()
  })

  // validar se emails diferentes vindos do mesmo ip, que não excedam o broad, não podem ser bloqueados
  it('NÃO deve bloquear um email diferente, mesmo vindo do mesmo IP (se não exceder o Broad)', async () => {
    const emailBloqueado = faker.internet.email()
    // Estoura o Targeted para emailBloqueado
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({ email: emailBloqueado, password: 'x' })
    }

    // Envio da requisição 6°. Tentar com outro email (Será a requisição 6 no IP, limite Broad é 20, logo deve passar)
    const outroEmail = faker.internet.email()
    const response = await request(app)
      .post('/auth/login')
      .send({ email: outroEmail, password: 'x' })

    expect(response.status).not.toBe(429)
  })
})

describe('Rate limiter - POST /auth/register (RF-12 / RNF-06)', () => {
  // Testando o TARGETED de registro (Email bombing)
  it('deve bloquear (Targeted) com 429 a partir da 6ª tentativa de registro para o MESMO e-mail', async () => {
    const dadosBase = { password: 'SenhaForte123!', name: 'Teste' }
    const mesmoEmail = faker.internet.email() // FIXADO fora do loop

    // Esgota o limite de 5 requisições
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/auth/register')
        .send({ ...dadosBase, email: mesmoEmail })
    }

    const res = await request(app)
      .post('/auth/register')
      .send({ ...dadosBase, email: mesmoEmail })

    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/este e-mail/i)
  })
})
