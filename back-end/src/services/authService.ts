// camada responsável por lidar com as regras de negócio. Além disso, é onde eu faço a comparação de senha utilizando bcrypt-ts para garantir a segurança dos dados do usuário.
// Regras de negócio (validar, hashear, comparar). Só conhece o REPOSITORY

import { genSaltSync, hashSync, compare } from 'bcrypt-ts'
import { userRepository } from '../repositories/userRepositories'

export const authService = {
  // pegando usuário cadastrado no banco de dados
  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)

    if (!user) {
      throw { status: 404, message: 'Usuário não encontrado' }
    }

    // comparando a senha dada no front com a usuário no banco de dados
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      throw { status: 401, message: 'Senha incorreta' }
    }

    return { id: user.id, name: user.name, email: user.email, cep: user.cep }
  },

  // registrar usuário no banco de dados
  register: async (name: string, email: string, password: string, cep: string) => {
    const existing = await userRepository.findByEmail(email)

    if (existing) {
      throw { status: 409, message: 'Email já cadastrado' }
    }

    const salt = genSaltSync(10)
    const hashedPassword = hashSync(password, salt)

    const newUser = await userRepository.create({ name, email, password: hashedPassword, cep })

    return { id: newUser.id, name: newUser.name, email: newUser.email, cep: newUser.cep }
  },
}
