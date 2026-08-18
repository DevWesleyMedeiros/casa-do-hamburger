import type { User } from '../../generated/prisma/index.js'

export type JwtPayloadDTO = Pick<User, 'id' | 'admin'>

export const toJwtPayloadDTO = (user: User): JwtPayloadDTO => {
  return {
    id: user.id,
    admin: user.admin,
  }
}
