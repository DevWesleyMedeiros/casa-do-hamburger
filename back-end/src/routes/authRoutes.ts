// camada que somente irá definir os endpoints relacionados à autenticação (login e registro) e outras rotas, e delegar as requisições para os controllers responsáveis por lidar com as regras de negócio.
// esse arquivo é como se fosse um garçom: recebe os pedidos e os passa adiante. Não cozinha nada
// vai mapear URL + método HTTP. Só conhece os CONTROLLERS

// 🍽️ ROUTE — só mapeia URL para o Controller
import { Router } from 'express'
import { authController } from '../controllers/authControllers'

const router = Router()

router.post('/login', authController.login)
router.post('/register', authController.register)

export default router
