// arquivo inicial padrão do projeto
import cors from 'cors'
import express, { type Request, type Response } from 'express'
import { connection, prisma } from './src/db'
import { genSaltSync, hashSync, compare } from 'bcrypt-ts'

const app = express()

app.use(express.json())

connection()

app.use(cors())

// lógica para rota de login de um usuário
app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email e Senha são obrigatórios' })
      return
    }

    const users = await prisma.user.findFirst({
      where: { email: email },
    })

    if (!users) {
      res.status(404).json({ message: 'usuário não encontrado' })
      return
    }

    const matchingHashedPass = await compare(password, users.password)

    if (!matchingHashedPass) {
      res.status(401).json({ message: 'Senha incorreta' })
      return
    }

    if (!users) {
      res.status(404).json({ message: 'usuário não encontrado' })
      return
    }

    res.status(200).json({
      id: users.id,
      name: users.name,
      email: users.email,
      cep: users.cep,
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' })
    return
  }
})

// lógica para rota de registro de um usuário
app.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, cep } = req.body

    if (!name || !email || !password || !cep) {
      res.status(400).json({ message: 'Todas as informações são obrigatórias' })
      return
    }

    const salt = genSaltSync(10)
    const hashedPassword = hashSync(password, salt)

    const user = await prisma.user.findFirst({
      where: { email: email },
    })

    if (user?.email) {
      res.status(409).json({ message: 'Email já cadastrado' })
      return
    }

    const newUser = await prisma.user.create({
      data: { name: name, email: email, cep: cep, password: hashedPassword },
    })

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      cep: newUser.cep,
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' })
  }
})

// rodando o servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
