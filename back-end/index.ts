// arquivo inicial padrão do projeto
import express from 'express'
import cors from 'cors'
import { connection } from './src/db'

const app = express()
connection()

app.use(cors())

// método http get
app.get('/teste', (req, res) => {
  res.json('Você acessou a rota teste')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
