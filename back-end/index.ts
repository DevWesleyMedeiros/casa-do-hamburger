// arquivo inicial padrão do projeto
import cors from 'cors'
import express from 'express'
import { connection } from './src/db'
import authRoutes from './src/routes/authRoutes'

const app = express()

app.use(cors())
app.use(express.json())

connection()

// Todas as rotas de auth sob o prefixo /auth (opcional mas recomendado para fins de organização do código) ou seja, http://localhost:3000/auth/register
app.use('/auth', authRoutes)

// rodando o servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
