// vamos criar um middleware genérico e reutilizável
// Em vez de validar Zod manualmente em cada controller, um middleware genérico resolve para qualquer schema futuro (login, products, etc.)

import { ZodType } from 'zod'
import type { Request, Response, NextFunction } from 'express'
