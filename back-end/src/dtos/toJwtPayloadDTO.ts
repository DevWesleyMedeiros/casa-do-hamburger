import type { User } from '../../generated/prisma/index.js'

// o jwt só assina um cookie, se eu tiver acesso a chave dele, eu posso verificar todas as demais informações do usuário da sessão. Com esse DTO, eu escondo as demais informações e trago somente id e admin, sem dados de perfil
export type JwtPayloadDTO = Pick<User, 'id' | 'admin'>

export const toJwtPayloadDTO = (user: User): JwtPayloadDTO => {
  return {
    id: user.id,
    admin: user.admin,
  }
}
