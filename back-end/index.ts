// arquivo inicial padrão do projeto
import cors from 'cors';
import express, { type Request, type Response } from 'express'
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
app.post('/login', async (req: Request, res: Response) => {
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

// rota para registro de um usuário
app.post('/register', async (req: Request, res: Response) => {
  try {
    // vem do frontend como payload (formulário de cadastro)
    const { name, email, password, cep } = req.body

    // tratar para ver se as informações vindas do front existem
    if (!name || !email || !password || !cep) {
      res.status(400).json({ message: 'Todas as informações são obrigatórias' })
      return
    }

    // vamos testar, quando o usuário tentar cadastrar um novo usuário, lá no meu banco de dados, e o email que ele dar, já existir
    const user = await prisma.user.findFirst({
      where: { email: email },
    })

    // uma vez procurado no banco de dados, agora, eu preciso verificar se o que foi encontrado no banco de dados é igual ao que foi passado no payload.? indica que essa pode ser que o email me retorne um undefined
    if (user?.email) {
      res.status(409).json({ message: 'Email já cadastrado' })
      return
    }
    // criando um novo usuário no meu banco de dados, de acordo com as informações definidas no schema do prisma que vão virar colunas com tipos de dados no meu banco de dados
    // Ex.: name(1°) = coluna/schema Prisma: name(2°) = valor vindo do payload (frontend); isso para todos os valores
    const newUser = await prisma.user.create({
      data: { name: name, email: email, cep: cep, password: password },
    })

    res.status(201).json(newUser) // retornado o novo usuário criado
  } catch (error) {}
})

// rodando o servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
