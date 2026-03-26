import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middleware/auth'
import { getCurrentUser, updateProfile } from '../controllers/authController'
import { getUsers, updateUserRole, updateUserStatus } from '../controllers/userController'

const router = Router()

// 获取用户信息
router.get('/info', authMiddleware, getCurrentUser)

// 更新用户信息
router.put('/info', authMiddleware, updateProfile)

// 管理员：获取用户列表
router.get('/', roleMiddleware('admin'), getUsers)

// 管理员：修改用户角色
router.put('/:id/role', roleMiddleware('admin'), updateUserRole)

// 管理员：封禁/解封用户
router.patch('/:id/status', roleMiddleware('admin'), updateUserStatus)

export default router
