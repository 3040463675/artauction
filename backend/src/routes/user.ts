import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middleware/auth'
import { getCurrentUser, updateProfile } from '../controllers/authController'

const router = Router()

// 获取用户信息
router.get('/info', authMiddleware, getCurrentUser)

// 更新用户信息
router.put('/info', authMiddleware, updateProfile)

// 管理员路由示例
router.get('/list', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.success({ message: '管理员功能' })
})

export default router
