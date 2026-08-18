import type { User } from '../../generated/prisma/index.js'

export type UserDTO = Omit<User, 'password'>

export const toUserDTO = (user: User): UserDTO => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    admin: user.admin,
    cep: user.cep,
  }
}
