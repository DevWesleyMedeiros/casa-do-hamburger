// arquivo que conecta meu cliente prisma com meu backend

import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { getTestDatabaseUrl } from './shared/utils/testDatabaseSafety.js';

// Vitest e NODE_ENV=test nunca podem herdar DATABASE_URL do desenvolvimento/produção.
// A guarda roda antes da criação do adapter/cliente e, portanto, antes de conectar.
const connectionString =
  process.env['VITEST'] || process.env['NODE_ENV'] === 'test'
    ? getTestDatabaseUrl()
    : process.env['DATABASE_URL'];

if (!connectionString) throw new Error('DATABASE_URL não configurada');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// forma antiga de usar o prisma
// const prisma = new PrismaClient()

export { prisma };

// função que cria uma conexão com meu BD
export async function connection() {
  try {
    await prisma.$connect();
    console.warn('Conectado com o meu Banco de Dados');
  } catch {
    throw new Error('Não foi possível conectar ao banco de dados');
  }
}
