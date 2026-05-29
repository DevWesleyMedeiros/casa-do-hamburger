// arquivo inicial padrão do projeto
import cors from 'cors'
import express from 'express'
import { connection, prisma } from './src/db'

const app = express()

// linha ela me permite dizer para o meu express interpretar requisições do tipo json. Caso isso não for dados, qualquer tentativa de envio de dados no corpo em formato json, não será entendida pelo express
app.use(express.json())
connection()

app.use(cors())

// método http get. Vamos buscar informações do meu banco de dados via "prisma.user.findMany" onde user (tudo que eu defini no meu schema e a função findMany (retorna os atributo e valores de tudo aquilo que eu tenho no meu banco de dados))
// app.get('/', async (req, res) => {
//   const users = await prisma.user.findMany()
//   res.json(users)
// })

// método http post: para enviar informações para o meu banco de dados
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const users = await prisma.user.findFirst({
    where: { email, password },
  })
  // res.json({ email, password })
  res.json(users)
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
