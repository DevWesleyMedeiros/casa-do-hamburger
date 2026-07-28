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

// teste para requisições dentro da janela e tentativas (loginLimiter)
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
    // req de 6° tentiva para forçar o estouro de limite
    const response = await request(app).post('/auth/login').send({ email, password: 'x' })

    expect(response.status).toBe(429)
    // Formato padronizado { message, status } alinhado ao resto da app
    expect(response.body.message).toMatch(/este e-mail/i) // Garante que foi o Targeted que bloqueou
    expect(response.body.status).toBe(429)
  })

  // Testando o BROAD (loginLimiter)
  it('deve bloquear (Broad) com 429 a partir da 21ª tentativa da mesma origem, com e-mails DIFERENTES', async () => {
    // Esgota o limite Broad (20), mas desvia do Targeted mudando o e-mail sempre
    for (let i = 0; i < 20; i++) {
      await request(app).post('/auth/login').send({ email: faker.internet.email(), password: 'x' }) // E-mail único a cada vez, a cada iteração com se fosse tentativas de login
    }

    // última requisição para forçar no estouro de broad
    const response = await request(app)
      .post('/auth/login')
      .send({ email: faker.internet.email(), password: 'x' })

    expect(response.status).toBe(429)
    expect(response.body.message).toMatch(/nesta origem/i) // Garante que foi o Broad que bloqueou
    expect(response.body.status).toBe(429)
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
    const dadosBase = { password: 'SenhaForte123!', name: 'Teste', cep: '12345-678' }
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
    expect(res.body.message).toMatch(/este e-mail/i)
    expect(res.body.status).toBe(429)
  })

  // Teste do BROAD de registro 
  it('deve bloquear (Broad) com 429 a partir da 11ª tentativa de registro, e-mails DIFERENTES, mesma origem', async () => {
    const dadosBase = { password: 'SenhaForte123!', name: 'Teste', cep: '12345-678' }

    // Esgota limite Broad de registro = 10 em 60min, mudando e-mail a cada vez
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/auth/register')
        .send({ ...dadosBase, email: faker.internet.email() })
    }

    // 11ª tentativa deve ser rejeitada pelo Broad
    const res = await request(app)
      .post('/auth/register')
      .send({ ...dadosBase, email: faker.internet.email() })

    expect(res.status).toBe(429)
    expect(res.body.message).toMatch(/nesta origem/i) // Broad: "Muitas tentativas NESTA ORIGEM"
    expect(res.body.status).toBe(429)
  })
})

// Confirma que rate limit é só em /login e /register, NÃO no resto de /auth
describe('Rate limiter — escopo correto: APENAS /login e /register (RNF-06)', () => {
  it('NÃO aplica rate limiter em /auth/products mesmo após 25 requisições da mesma origem', async () => {
    // Passa do limite Broad de login (20) para garantir que se o limiter estivesse aplicado globalmente retornaria 429. 
    // Se a rota estiver fora do limiter, vai retornar o status de negócio dela (404/200 — o que vier do controller) e NUNCA 429.
    for (let i = 0; i < 25; i++) {
      const res = await request(app).get('/auth/products')
      expect(res.status).not.toBe(429)
    }
  })

  it('NÃO aplica rate limiter em /auth/me (rota protegida sem credencial → 401 mas nunca 429)', async () => {
    for (let i = 0; i < 30; i++) {
      const res = await request(app).get('/auth/me')
      // me retorna 401 por falta de cookie de auth — o importante é NÃO ser 429
      expect(res.status).not.toBe(429)
      expect(res.status).toBe(401)
    }
  })

  it('NÃO aplica rate limiter em /auth/logout mesmo após muitas chamadas', async () => {
    for (let i = 0; i < 30; i++) {
      const res = await request(app).post('/auth/logout')
      expect(res.status).not.toBe(429)
    }
  })
})
