import { Router } from 'express'
import { body } from 'express-validator'
import { getNonce, verifySignature, getCurrentUser, updateProfile } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 获取nonce
router.get('/nonce', getNonce)

// 验证签名登录
router.post('/verify', [
  body('address').notEmpty().withMessage('地址不能为空'),
  body('signature').notEmpty().withMessage('签名不能为空'),
  body('message').notEmpty().withMessage('消息不能为空')
], verifySignature)

// 获取当前用户信息
router.get('/me', authMiddleware, getCurrentUser)

// 更新用户信息
router.put('/profile', authMiddleware, updateProfile)

export default router
