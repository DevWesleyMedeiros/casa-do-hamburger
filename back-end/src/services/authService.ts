// camada responsável por lidar com as regras de negócio. Além disso, é onde eu faço a comparação de senha utilizando bcrypt-ts para garantir a segurança dos dados do usuário.
// Regras de negócio (validar, hashear, comparar). Só conhece o REPOSITORY

import { compare, genSaltSync, hashSync } from 'bcrypt-ts'
import * as jose from 'jose'
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

    // criando e atribuindo à variável o valor da chave Comprimento: 256 bits (64 caracteres se for em formato hexadecimal). variável settada no .env do projeto
    const jwtSecretEnv = process.env['JWT_SECRET']

    // se ela não existir, um undefined será gerado. Logo temos de tratar elas
    if (!jwtSecretEnv) {
      throw new Error('Variável de ambiente ainda não foi configurada')
    }

    const secret = new TextEncoder().encode(jwtSecretEnv)

    // CORREÇÃO DE SEGURANÇA: Filtrar os dados do usuário para NÃO incluir a senha no payload
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      cep: user.cep,
    }

    // gerando a assinatura do payload
    const token = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setExpirationTime('7d') // retorna um valor em milissegundos e deve estar alinhado com o maxAge do cookie
      .sign(secret)
    // const { payload } = await jose.jwtVerify(token, secret)

    // 3. RETORNO IDEAL: Retorna o token gerado e os dados públicos para o Controller enviar ao Front-end
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, cep: user.cep },
    }
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
