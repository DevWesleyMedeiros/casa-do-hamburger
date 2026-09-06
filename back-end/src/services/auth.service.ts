/**
 * Camada de regra de negócio de autenticação.
 *
 * Responsabilidades:
 * - login: valida credenciais contra o banco (com defesa anti-timing-attack
 *   para não permitir enumeração de usuários, ver comentário inline) e,
 *   se válidas, assina um JWT contendo SÓ dado de sessão (toJwtPayloadDTO
 *   → id + admin). O usuário completo (User do Prisma) também é retornado
 *   para o controller decidir o que expor na resposta HTTP (via toUserDTO).
 * - register: garante unicidade de email, faz hash da senha (bcrypt) e
 *   persiste o novo usuário. Retorna o User completo — a responsabilidade
 *   de "o que expor" fica no controller, não aqui.
 *
 * Não sabe nada sobre HTTP (não seta cookie, não monta Response) — isso
 * é responsabilidade do controller. Este arquivo só orquestra regra de
 * negócio + acesso a dado (via userRepository).
 */
import { compare, genSaltSync, hashSync } from 'bcrypt-ts'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt.js'
import { toJwtPayloadDTO } from '../dtos/toJwtPayloadDTO.js'
import { AppError } from '../errors/AppError.js'
import { userRepository } from '../repositories/user.repository.js'

export const authService = {
  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)

    // OWASP A07 + US-02 (nota de segurança no REGRAS_DE_NEGOCIO):
    // NÃO diferenciar "usuário não existe" de "senha errada" — evita enumeração.
    // Compara o hash mesmo sem usuário para equalizar tempo de resposta
    // (senão atacante distingue os dois casos por timing: bcrypt ~200ms vs instantâneo).
    const dummyHash = '$2b$10$dXHhLJnhR70QFKD2krJlne9pU3y5gPmCvXrFXipEfaVXP2E0v1uUK'
    const passwordMatch = user ? await compare(password, user?.password ?? dummyHash) : await compare(password, dummyHash)

    if (!user || !passwordMatch) {
      throw new AppError(401, 'Credenciais inválidas')
    }

    // Payload do JWT agora carrega SÓ dado de sessão (id + admin).
    // name/email ficam de fora do token — são dado de perfil, não de sessão,
    // e não deveriam viajar decodificáveis num cookie de 7 dias.
    const token = await new jose.SignJWT(toJwtPayloadDTO(user))
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getJwtSecret())

    return {
      token,
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
    return newUser
  },
}
