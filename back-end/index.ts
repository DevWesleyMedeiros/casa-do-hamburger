// arquivo inicial padrão do projeto
import cors from 'cors'
import express from 'express'
import { connection } from './src/db'
import authRoutes from './src/routes/authRoutes'
import cookieParser from 'cookie-parser'

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173', // URL do front-end ajustar conforme necessário. Isso faz com que o navegador permita que o front-end faça requisições para o back-end mesmo estando em domínios diferentes (CORS). Vai aceitar requisições dessa origem específica, ou seja, do front-end rodando localmente na porta 5173. Se for para produção, ajuste para a URL do seu front-end em produção.
    credentials: true, // permite envio de cookies do front-end para o back-end, necessário para autenticação baseada em cookies. Sem isso, o navegador não enviará os cookies nas requisições, mesmo que o back-end os configure corretamente.
  }),
)
app.use(express.json())
app.use(cookieParser())

connection()

// Todas as rotas de auth sob o prefixo /auth (opcional mas recomendado para fins de organização do código) ou seja, http://localhost:3000/auth/register
app.use('/auth', authRoutes)

// rodando o servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
