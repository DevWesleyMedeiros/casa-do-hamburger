// arquivo inicial padrão do projeto
import cors from 'cors';
import express from 'express';
import { connection, prisma } from './src/db';

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
  try {
    const { email, password } = req.body

    // tratando erros de valores falsy que podem ser requisitados no meu lado cliente, por isso o valor do status de erro 400 para "erros do lado do cliente" tipo "bad request"
    if (!email || !password) {
      res.status(400).json({ message: 'Email e Senha são obrigatórios' })
      return
    }

    // buscando, no meu banco de dados, as informações que vieram do frontend
    const users = await prisma.user.findFirst({
      where: { email, password },
    })

    // verificar se esse objeto user com {email e password} contém no meu banco de dados. Se não tiver, eu não posso retornar nada. Erro 404 tipo "not found" O servidor não pode encontrar o recurso solicitado.
    if (!users) {
      res.status(404).json({ message: 'usuário não encontrado' })
      return
    }
    res.status(200).json(users)
  } catch (error) {
    // setting up um erro de servidor do tipo 500 "internal server error"
    res.status(500).json({ message: 'Erro no servidor' })
    return
  }
})

// rodando o servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
