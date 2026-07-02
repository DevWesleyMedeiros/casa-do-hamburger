// camada responsável por lidar com as regras de negócio. Além disso, é onde eu faço a comparação de senha utilizando bcrypt-ts para garantir a segurança dos dados do usuário.
// Regras de negócio (validar, hashear, comparar). Só conhece o REPOSITORY

import { compare, genSaltSync, hashSync } from 'bcrypt-ts';
import * as jose from 'jose';
import { getJwtSecret } from '../config/jwt';
import { userRepository } from '../repositories/userRepositories'

class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'AppError' // nome da classa ao dar o error
    // seta a cadeia de protótipos para AppError
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const authService = {
  // pegando usuário cadastrado no banco de dados (POST)
  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado')
    }

    // comparando a senha dada no front com a usuário no banco de dados
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      throw new AppError(401, 'Senha incorreta')
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
    } catch (error: any) {
      // defino o erro do tipo erro para acionar a classe AppError
      throw new AppError(error.status || 401, error.message || 'Token inválido ou expirado')
      // 401 se o erro de status não existir
    }
  },

  // registrar usuário no banco de dados (POST)
  register: async (name: string, email: string, password: string, cep: string) => {
    const existing = await userRepository.findByEmail(email)

    if (existing) {
      throw new AppError(409, 'Email já cadastrado')
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
      throw new AppError(404, 'Nenhum produto cadastrado no sistema')
    }
    return productsDate
  },
  deleteProduct: async (id: string) => {
    const deleted = await userRepository.findProductAndDelete(id)

    if (!deleted) {
      throw new AppError(404, 'produto não encontrado ou já foi deletado')
    }
    return deleted
    // me retorna o produto deletado
  },
  findProductInCartItem: async (userId: string) => {
    const productsFound = await userRepository.findCartItemProduct(userId)
    if (!productsFound) {
      throw new AppError(404, 'produtos não encontrados ou já foram deletados')
    }
    return productsFound
  },
  addToCart: async (productId: string, userId: string) => {
    const cartItems = await userRepository.createCartItem(productId, userId)

    if (cartItems === null) {
      throw new AppError(404, 'cartItems não encontrados ou deletados')
    }
    return cartItems
  },
  deleteCartItemById: async (cartItemId: string, userId: string) => {
    const deleted = await userRepository.deleteCartItemById(cartItemId, userId)

    if (!deleted) {
      throw new AppError(
        404,
        'Item do carrinho não encontrado ou já foi deletado ou não pertence ao usuário',
      )
    }
    return deleted
  },
}
