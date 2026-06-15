// camada que somente irá definir os endpoints relacionados à autenticação (login e registro) e outras rotas, e delegar as requisições para os controllers responsáveis por lidar com as regras de negócio.
// esse arquivo é como se fosse um garçom: recebe os pedidos e os passa adiante. Não cozinha nada
// vai mapear URL + método HTTP. Só conhece os CONTROLLERS

// 🍽️ ROUTE — só mapeia URL para o Controller
import { Router } from 'express'
import { authController } from '../controllers/authControllers'
import { clearAuthCookie } from '../middlewares/clearAuthCookie'
import { requireAuth } from '../middlewares/authMiddlewares'
// import { requiredAdmin } from '../middlewares/requiredAdmin'

const router = Router()

router.post('/login', authController.login)
router.post('/register', authController.register)

// Usa o requireAuth normal para obter os dados do usuário logado
router.get('/me', requireAuth, authController.userAuth)

// requiredAuth como segundo parâmetro - roda antes do controller por causa do next()
//// Usa o clearAuthCookie para limpar o cookie ANTES de cair no controller de logout
router.post('/logout', requireAuth, clearAuthCookie, authController.logout)

//rota de produtos
router.get('/products', authController.getProducts)

export default router
