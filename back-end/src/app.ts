// src/app.ts
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import cors from 'cors'
import { connection } from './db.js'
import cookieParser from 'cookie-parser'

connection()

// Todas as rotas de auth sob o prefixo /auth (opcional mas recomendado para fins de organização do código) ou seja, http://localhost:3000/auth/resto-da-rota

export const app = express()

// ⚠️ OBRIGATÓRIO para Railway/Vercel e qualquer proxy reverso
// Confia nos headers X-Forwarded-* enviados por 1 camada de proxy (load balancer)
// Sem isto, `req.ip` retorna o IP interno do Railway, não o IP real do cliente,
// e o rate limiting torna-se completamente ineficaz (todos contam como 1 origem).
app.set('trust proxy', 1)

// coors no top antes de toda resposta
app.use(
  cors({
    origin: 'http://localhost:5173', // URL do front-end ajustar conforme necessário. Isso faz com que o navegador permita que o front-end faça requisições para o back-end mesmo estando em domínios diferentes (CORS). Vai aceitar requisições dessa origem específica, ou seja, do front-end rodando localmente na porta 5173. Se for para produção, ajuste para a URL do seu front-end em produção.
    credentials: true, // permite envio de cookies do front-end para o back-end, necessário para autenticação baseada em cookies. Sem isso, o navegador não enviará os cookies nas requisições, mesmo que o back-end os configure corretamente.
  }),
)
app.use(express.json())
app.use(cookieParser())

// rotas só depois de todos os pipelines de middlewares globais
app.use('/auth', authRoutes)
// Todas as rotas de auth sob o prefixo /auth (opcional mas recomendado para fins de organização do código) ou seja, http://localhost:3000/auth/resto-da-rota

// app.use(cors())
// app.use(cookieParser())
// app.use(express.json())
