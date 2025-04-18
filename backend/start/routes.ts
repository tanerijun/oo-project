/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import env from '#start/env'
import { middleware } from './kernel.js'
const AuthController = () => import('#controllers/auth_controller')

router.post('register', [AuthController, 'register']).as('auth.register')
router.post('login', [AuthController, 'login']).as('auth.login')
router.delete('logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
router.get('me', [AuthController, 'me']).as('auth.me')

router.get('/', async () => {
  return {
    hello: env.get('DB_HOST'),
  }
})

router.get('/note', async () => {
  return {
    note: 'testnote',
  }
})
