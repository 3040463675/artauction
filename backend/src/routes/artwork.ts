import { Router } from 'express'
import { body } from 'express-validator'
import {
  getArtworks,
  getArtworkById,
  getArtworksByOwner,
  createArtwork,
  updateArtwork,
  verifyArtwork
} from '../controllers/artworkController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = Router()

// 获取艺术品列表
router.get('/', getArtworks)

// 获取艺术品详情
router.get('/:id', getArtworkById)

// 获取用户的艺术品
router.get('/owner', getArtworksByOwner)

// 创建艺术品记录
router.post('/', authMiddleware, [
  body('tokenId').isInt({ min: 0 }).withMessage('Token ID必须为非负整数'),
  body('name').notEmpty().withMessage('名称不能为空'),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('imageUrl').notEmpty().withMessage('图片URL不能为空')
], createArtwork)

// 更新艺术品
router.put('/:id', authMiddleware, updateArtwork)

// 验证艺术品（拍卖行权限）
router.post('/:id/verify', authMiddleware, roleMiddleware('auction_house', 'admin'), verifyArtwork)

export default router
