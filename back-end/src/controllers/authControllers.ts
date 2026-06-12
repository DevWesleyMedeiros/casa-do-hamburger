// camada responsável por lidar com as requisições relacionadas à autenticação (login e registro)
// 👨‍🍳 CONTROLLER — ponte entre HTTP e o Service.
// // esse arquivo é como se fosse o chef: ele coordena os pedidos. Sabe o que fazer, mas não vai ao estoque
// Só lida com req, res e repassa para o Service
// vai receber do front, processar e retornar, mas não cria a lógica das regras de negócio. As regras de negócio são importada aqui no authService
// Receber req/res, chamar Service, retornar resposta. Só conhece os SERVICES

import type { Request, Response } from 'express';
// request - o que vem do frontend: requisição
// response - tudo o que meu backand reponde para o frontend

import { authService } from '../services/authService';

export const authController = {
  // busco o usuário que foi registrado e o retorno por aqui para o frontend
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({ message: 'Email e Senha são obrigatórios' })
        return
      }
      // chamando a função de login do authService, que é onde tem a lógica de comparação de senha e busca do usuário no banco de dados
      const { token, user } = await authService.login(email, password)

      // criar cookie com as informações do usuário (sem a senha) e configurar opções de segurança
      res.cookie('user_section', token, {
        httpOnly: true, // JS do browser não lê. O cookie é exclusivo do HTTP — o browser o envia automaticamente nas requisições, mas bloqueia qualquer acesso via JavaScript, incluindo document.cookie. É uma proteção de segurança contra ataques XSS.

        secure: process.env['NODE_ENV'] === 'production', // faz ler HTTPS somente no modo produção
        sameSite: 'lax', // proteção CSRF básica
        maxAge: 7 * 24 * 60 * 60 * 1000, // definido para 15 segundos  // 7 * 24 * 60 * 60 * 1000,   7 dias = 604.800.000 em missêgundos; 1 segundo equivale a 1000 milissêgundos
      })

      res.status(200).json({ user })
    } catch (err: any) {
      const status = err?.status ?? 500
      const message = err?.message ?? 'Erro no servidor'
      res.status(status).json({ message })
    }
  },

  // registra o usuário do frontend para o backend
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, cep } = req.body

      if (!name || !email || !password || !cep) {
        res.status(400).json({ message: 'Todas as informações são obrigatórias' })
        return
      }

      const user = await authService.register(name, email, password, cep)

      res.status(201).json(user)
    } catch (err: any) {
      const status = err?.status ?? 500
      const message = err?.message ?? 'Erro no servidor'
      res.status(status).json({ message })
    }
  },

  // Implementação do userAuth — lê o cookie e devolve o usuário decodificado.
  // O cookie da requisição fica disponível graças ao middleware 'cookie-parser'.
  userAuth: async (req: Request, res: Response) => {
    // O '?' (Optional Chaining) evita erros caso 'req.cookies' seja indefinido.
    const token = req.cookies?.user_section

    if (!token) {
      res.status(401).json({ message: 'Usuário não autentificado' })
      return
    }

    try {
      const user = await authService.getMe(token)
      res.status(200).json({ user })
    } catch (error: any) {
      res.status(error?.status ?? 401).json({ message: error?.message ?? 'Token inválido' })
    }
  },

  // rota de logout para apagar os cookies do usuário. A requisição que vem do frontend com os cookies e vamos verificar aqui se eles existem. Pega pelo nome do cookie. Vai em aplicação no devtools que consegue ver o nome
  logout: async (res: Response) => {
    // requireAuth já garantiu que o usuário está autenticado
    // só limpa o cookie e responde

    // user_section - nome do meu cookie
    res.clearCookie('user_section')
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  },
}
