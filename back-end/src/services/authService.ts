import { compare, genSaltSync, hashSync } from 'bcrypt-ts'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt.js'
import { userRepository } from '../repositories/userRepositories.js'
import { AppError } from '../errors/AppError.js'

export const authService = {
  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado')
    }
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      throw new AppError(401, 'Senha incorreta')
    }
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      cep: user.cep,
      admin: user.admin,
    }

    const token = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getJwtSecret())
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, admin: user.admin, cep: user.cep },
    }
  },

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
  products: async () => {
    const productsDate = await userRepository.findManyProducts()
    if (productsDate.length === 0) {
      throw new AppError(404, 'Nenhum produto cadastrado no sistema')
    }
    return productsDate
  },
  deleteProduct: async (id: string) => {
    const deleted = await userRepository.findProductAndDelete(id)
    return deleted
  },
  findProductInCartItem: async (userId: string) => {
    const productsFound = await userRepository.findCartItemProduct(userId)
    return productsFound
  },
  addToCart: async (productId: string, userId: string) => {
    const cartItems = await userRepository.createCartItem(productId, userId)
    return cartItems
  },
  deleteCartItemById: async (cartItemId: string, userId: string) => {
    const deleted = await userRepository.deleteCartItemById(cartItemId, userId)
    return deleted
  },
  updateCartItemQuantity: async (cartItemId: string, userId: string, quantity: number) => {
    const updated = await userRepository.updateCartItemQuantity(cartItemId, userId, quantity)
    return updated
  },
}
