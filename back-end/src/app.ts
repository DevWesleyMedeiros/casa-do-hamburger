import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { connection } from './db.js'
import { errorHandler } from './middlewares/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import cartRoutes from './routes/cart.routes.js'
import productsRoutes from './routes/products.routes.js'
import googleAuthRoutes from './routes/googleAuth.routes.js'

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
