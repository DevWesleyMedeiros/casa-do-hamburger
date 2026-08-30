import { app } from './app.js'

app.listen(3000, () => {
  console.warn('Server is running on port 3000')
})
// index.ts — middlewares globais (rodam em TODA requisição)
// separa o app da porta para deixá-lo testável sem precisar de uma porta real ocupada, e sem risco de dois testes rodando em paralelo brigarem pela mesma porta.
