import type { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod'

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const findFirstError = result.error.issues[0]?.message

      return res.status(400).json({ message: findFirstError }) // <- tipo Response
    }
    req.body = result.data
    next()
  }
}
