// arquivo que conecta meu cliente prisma com meu backend

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/index.js'

const connectionString = `${process.env['DATABASE_URL']}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// forma antiga de usar o prisma
// const prisma = new PrismaClient()

export { prisma }

// função que cria uma conexão com meu BD
export async function connection() {
  try {
    await prisma.$connect()
    console.log('Conectado com o meu Banco de Dados')
  } catch (error) {
    console.log(error)
  }
}
