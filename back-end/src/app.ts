import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { connection } from './db.js'
import { errorHandler } from './middlewares/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import cartRoutes from './routes/cart.routes.js'
import googleAuthRoutes from './routes/googleAuth.routes.js'
import productsRoutes from './routes/products.routes.js'

// conection linka o backend com o banco de dados. Deve ser a primeira linha
connection()

export const app = express()
app.disable('x-powered-by') // desabilita o header X-Powered-By, que contém a versão do Express usado para evitar ataques de informação

// TRUST PROXY OBRIGATÓRIO para Railway/Vercel e qualquer proxy reverso
// Confia nos headers X-Forwarded-* enviados por 1 camada de proxy (load balancer)
// Sem isto, `req.ip` retorna o IP interno do Railway, não o IP real do cliente,
// e o rate limiting torna-se completamente ineficaz (todos contam como 1 origem).
app.set('trust proxy', 1)
app.use(helmet())

// CORS no top antes de toda resposta
const allowedOrigins =
  process.env['NODE_ENV'] === 'production'
    ? [process.env['FRONTEND_URL'] || '']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('[CORS] Origem da requisição:', origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Origem não permitida pelo CORS'))
      }
    },
    credentials: true, // permite envio de cookies do front-end para o back-end, obrigatório para autenticação
    optionsSuccessStatus: 200, // compatibilidade com navegadores antigos
  }),
)
app.use(express.json())
app.use(cookieParser())

// rotas só depois de todos os pipelines de middlewares globais
app.use('/auth', authRoutes)
app.use('/auth', productsRoutes)
app.use('/auth', cartRoutes)

// registrar rota do GoogleAuth
app.use('/auth', googleAuthRoutes)

console.log('errorHandler no momento do use:', typeof errorHandler, errorHandler)

app.use(errorHandler)
// middleware que vai sempre por último — Express só invoca middleware de 4 parâmetros depois de todas as rotas

// app.use(cors())
// app.use(cookieParser())
// app.use(express.json())
