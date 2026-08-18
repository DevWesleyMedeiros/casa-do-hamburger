import { compare, genSaltSync, hashSync } from 'bcrypt-ts'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt.js'
import { AppError } from '../errors/AppError.js'
import { userRepository } from '../repositories/userRepositories.js'

export const authService = {
  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)

    // OWASP A07 + US-02 (🔒 nota de segurança no REGRAS_DE_NEGOCIO):
    // NÃO diferenciar "usuário não existe" de "senha errada" — evita enumeração.
    // Compara o hash mesmo sem usuário para equalizar tempo de resposta
    // (senão atacante distingue os dois casos por timing: bcrypt ~200ms vs instantâneo).
    const dummyHash = '$2b$10$dXHhLJnhR70QFKD2krJlne9pU3y5gPmCvXrFXipEfaVXP2E0v1uUK'
    const passwordMatch = user
      ? await compare(password, user.password)
      : await compare(password, dummyHash)

    if (!user || !passwordMatch) {
      throw new AppError(401, 'Credenciais inválidas')
    }
    const tokenPayload = {
      id: user.id,
      // name: user.name,
      // email: user.email,
      // cep: user.cep,
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
      // user: { id: user.id, name: user.name, email: user.email, admin: user.admin, cep: user.cep },
      user,
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
}
