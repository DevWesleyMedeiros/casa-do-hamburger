// camada que somente irá definir os endpoints relacionados à autenticação (login e registro) e outras rotas, e delegar as requisições para os controllers responsáveis por lidar com as regras de negócio.
// esse arquivo é como se fosse um garçom: recebe os pedidos e os passa adiante. Não cozinha nada
// vai mapear URL + método HTTP. Só conhece os CONTROLLERS

// ROUTE — só mapeia URL para o Controller
import { Router } from 'express'
import { authController } from '../controllers/authControllers'
import { requireAuth } from '../middlewares/authMiddlewares'
import { clearAuthCookie } from '../middlewares/clearAuthCookie'
import { requiredAdmin } from '../middlewares/requiredAdmin'
import { validateBody } from '../middlewares/validateBody'
import { loginSchema, registerSchema } from '../schemas/authSchemas'

const router = Router()

router.post('/login', validateBody(loginSchema), authController.login)
router.post('/register', validateBody(registerSchema), authController.register)

// Usa o requireAuth normal para obter os dados do usuário logado
router.get('/me', requireAuth, authController.userAuth)

// requiredAuth como segundo parâmetro - roda antes do controller por causa do next()
//// Usa o clearAuthCookie para limpar o cookie ANTES de cair no controller de logout
router.post('/logout', requireAuth, clearAuthCookie, authController.logout)

//rota de produtos
router.get('/products', authController.getProducts)

// rota para deletar produto
// rota — "id" é uma string literal, não um parâmetro de rota, por isso os :
// :id isso é só o "molde" do parâmetro. Na rota é só a sintaxe de declaração do Express — ele diz "aqui vai um parâmetro dinâmico chamado id". Quando faz a requisição de verdade, não inclui os dois pontos:
// acesso minha rota products normal, porém muda o método e devo passar um id
router.delete('/products/:id', requireAuth, requiredAdmin, authController.deleteProduct)

// rota do tipo get que irá buscar um item de CartItem
router.get('/get-cart-items', requireAuth, authController.productFindInCartItem)
router.post('/create-cart-item', requireAuth, authController.createCartItem)

export default router
