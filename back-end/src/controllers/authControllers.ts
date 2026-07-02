// camada responsável por lidar com as requisições relacionadas à autenticação (login e registro)
// CONTROLLER — ponte entre HTTP e o Service.
// esse arquivo é como se fosse o chef: ele coordena os pedidos. Sabe o que fazer, mas não vai ao estoque
// Só lida com req, res e repassa para o Service
// vai receber do front, processar e retornar, mas não cria a lógica das regras de negócio. As regras de negócio são importada aqui no authService
// Receber req/res, chamar Service, retornar resposta. São métodos que devem ser usados somente nos controllers Só conhece os SERVICES

import type { Request, Response } from 'express'
import { authService } from '../services/authService'

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
      // token e user são os retornos da minha função de login
      const { token, user } = await authService.login(email, password)

      // criar cookie com as informações do usuário (sem a senha) e configurar opções de segurança. Este cookie aqui será armazenado pelo meu Browser
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
      const user = await authService.register(name, email, password, cep)
      res.status(201).json(user)
    } catch (err: any) {
      const status = err?.status ?? 500
      const message = err?.message ?? 'Erro no servidor'
      res.status(status).json({ message, status })
    }
  },

  // Implementação do userAuth — lê o cookie e devolve o usuário decodificado.
  // O cookie da requisição fica disponível graças ao middleware 'cookie-parser'.
  // o cookie já foi decodificado com a função requiredAuth. Aqui eu só retorno
  userAuth: async (req: Request, res: Response) => {
    const user = req.user
    res.status(200).json({ user })
  },

  // rotas que usam o get vão devolver o res, portanto não usam o req. Use o _req para dizer ao typescript isole esse parâmetro, que se trata de uma assinatura do express. Ele não gera um erro, mas é para assegura que ele foi declarado, porém não foi usado.
  // rota de logout para apagar os cookies do usuário. A requisição que vem do frontend com os cookies e vamos verificar aqui se eles existem. Pega pelo nome do cookie. Vai em aplicação no devtools que consegue ver o nome
  logout: async (_req: Request, res: Response) => {
    // requireAuth já garantiu que o usuário está autenticado
    // só limpa o cookie e responde
    // user_section - nome do meu cookie

    res.clearCookie('user_section')
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  },

  getProducts: async (_req: Request, res: Response) => {
    try {
      const products = await authService.products()
      res.status(200).json(products)
    } catch (error: any) {
      res.status(error?.status ?? 500).json({ message: error?.message })
    }
  },
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      // id vem exatamente de onde eu passo :id na rota no frontend num objeto junto de outra propriedades no req.params, porém aqui eu só preciso dele para deleção

      //O método Array.isArray() verifica se um determinado valor ou objeto é um array (ou vetor). Ele retorna true se o valor for um array e false caso contrário
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'ID do produto inválido' })
      }

      await authService.deleteProduct(id)
      return res.status(200).json({ message: 'Produto deletado com sucesso' })
    } catch (error: any) {
      return res
        .status(error?.status ?? 500)
        .json({ message: error?.message ?? 'Erro no servidor' })
    }
  },
  productFindInCartItem: async (req: Request, res: Response) => {
    try {
      const { user } = req
      if (!user) {
        return res.status(404).json({ message: 'Usuário não econtrado' })
      }
      const getProductsFound = await authService.findProductInCartItem(user.id)
      return res.status(200).json(getProductsFound)
    } catch (error: any) {
      return res.status(error?.status ?? 500).json({ message: error?.message })
    }
  },
  createCartItem: async (req: Request, res: Response) => {
    try {
      const { user } = req // esse user trás meu user logado passado pelo requiredAuth middleware que o popula
      const { productId } = req.body // requisição vinda do meu body (frontend), mas do frontend, virá quando eu adicionar uma função no ícone do carrinho para cada produto

      if (!productId) {
        return res.status(400).json({ message: 'produto é obrigatório' })
      }

      const cartItemsReq = await authService.addToCart(productId, user.id)
      // user.id -> vem da requisição, assim que login na aplicação
      // productId.id -> vem do front quando eu clicar no ícone do carrinho em cada produto

      if (cartItemsReq === null) {
        return res.status(404).json({ message: 'Produto não encontrado' })
      }
      return res.status(200).json(cartItemsReq)
    } catch (error: any) {
      return res
        .status(error?.status ?? 500)
        .json({ message: error?.message ?? 'Erro no servidor' })
    }
  },
  deleteCartItemById: async (req: Request, res: Response) => {
    try {
      const { cartItemId } = req.params // vão retornar sempre strings
      // req.query retornar sempre objetos
      const userId = req.user?.id as string // vem do requireAuth, pois preciso saber se quem delete é realmente daquele usuário logado

      // valido o cartItemId que vem do req.params
      if (!cartItemId || Array.isArray(cartItemId)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      await authService.deleteCartItemById(cartItemId, userId)

      return res.status(200).json({ message: 'Item do carrinho deletado com sucesso' })
    } catch (error: any) {
      return res
        .status(error?.status ?? 500)
        .json({ message: error?.message ?? 'Erro no servidor' })
    }
  },
}
