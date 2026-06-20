// camada responsável por lidar com as regras de negócio. Além disso, é onde eu faço a comparação de senha utilizando bcrypt-ts para garantir a segurança dos dados do usuário.
// Regras de negócio (validar, hashear, comparar). Só conhece o REPOSITORY

import { compare, genSaltSync, hashSync } from 'bcrypt-ts';
import * as jose from 'jose';
import { getJwtSecret } from '../config/jwt';
import { userRepository } from '../repositories/userRepositories';

export const authService = {
  // pegando usuário cadastrado no banco de dados (POST)
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

    // CORREÇÃO DE SEGURANÇA: Filtrar os dados do usuário para NÃO incluir a senha no payload
    // O payload abaixo é o que será tokenizado. Se eu encontro o usuário cadastrado no banco de dados pelo email dele, então eu retorno o que está abaixo para o front
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      cep: user.cep,
      admin: user.admin,
    }

    // gerando a assinatura do payload. Pega o token informações do usuário e as codifica
    const token = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setExpirationTime('7d') // define expiração em 7 dias — jose calcula o timestamp exp automaticamente e deve estar alinhado com o maxAge do cookie
      .sign(getJwtSecret())

    // RETORNO IDEAL: Retorna o token gerado e os dados públicos para o Controller enviar ao Front-end
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, admin: user.admin, cep: user.cep },
    }
  },

  // regra que decodifica o token vindo do cookie do frontend com o payload abaixo (GET)
  getMe: async (token: string) => {
    try {
      const { payload } = await jose.jwtVerify(token, getJwtSecret())
      return {
        id: payload['id'],
        name: payload['name'],
        email: payload['email'],
        cep: payload['cep'],
        admin: payload['admin'],
      }
    } catch (error) {
      // lança uma excesão se o token adulterado, expirado ou adulterado
      throw { status: 401, message: 'Token inválido' }
    }
  },

  // registrar usuário no banco de dados (POST)
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

  // buscar produtos do banco de dados (GET)
  products: async () => {
    const productsDate = await userRepository.findManyProducts()

    // arrays vazios [] são valores truthy do javascript, portanto uma validação de negação unicamentem, aqui não funcionaria
    if (productsDate.length === 0) {
      throw { status: 404, message: 'Nenhum produto cadastrado no sistema' }
    }
    return productsDate
  },
  deleteProduct: async (id: string) => {
    const deleted = await userRepository.findProductAndDelete(id)
    return deleted
  },
}
