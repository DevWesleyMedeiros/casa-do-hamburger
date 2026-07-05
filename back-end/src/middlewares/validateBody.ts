import type { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod' // zodType = qualquer schema zod criado que valida valores do req (front)

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const result = schema.safeParse(req.body) // safeParse = valida o req.body com o schema zod passado como parâmetro. Retorna um objeto com success: boolean e data: clone tipado do req.body (se válido) ou error: ZodError (se inválido)
    // Usa-se o safeparse para validar um input. Se o dado for válido, ele retorna o clone tipado do dado. Caso contrário, ele lança um erro (ZodError) imediatamente, obrigando o uso de um bloco try/catch para tratamento. No entanto, com o safeparse os try catch são dispensado
    // Ele retorna um objeto simples com uma propriedade booleana success
    // resumindo, ele parseia as informações do body

    if (!result.success) {
      const findFirstError = result.error.issues[0]?.message
      // error.issues = array que contém erros detalhados vindo do parse. Aqui eu pego o primeiro erro e o retorno
      return res.status(400).json({ message: findFirstError }) // <- tipo Response
    }
    // substitui req.body pelo dado já validado e tipado
    // garante que o controller só recebe dados que passaram no Zod
    req.body = result.data
    next() // deve ser passado como tipo void
  }
}
