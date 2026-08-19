import type { User } from '../../generated/prisma/index.js'

/**
 * DTO de PERFIL do usuário.
 *
 * Representa os dados "públicos" de um usuário — o que pode ser exibido
 * na tela (nome, email, se é admin) sem expor dado sensível de banco
 * (password) nem dado que não faz parte da identidade pública (cep).
 *
 * Usado sempre que o usuário completo (vindo do Prisma) precisa virar
 * resposta de API: login, register, /me. NÃO é usado para montar o JWT
 * — para isso existe o toJwtPayloadDTO (ver toJwtPayloadDTO.ts).
 */
export type UserDTO = Pick<User, 'id' | 'name' | 'email' | 'admin'>

export const toUserDTO = (user: User): UserDTO => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    admin: user.admin,
  }
}
