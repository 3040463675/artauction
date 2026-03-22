import { Router } from 'express'
import { body } from 'express-validator'
import {
  getAuctions,
  getAuctionById,
  getBidHistory,
  getHotAuctions,
  getEndingSoonAuctions,
  createAuction,
  updateAuctionStatus,
  recordBid,
  getMyBids,
  getMyAuctions,
  toggleHotAuction,
  adminDeleteAuction
} from '../controllers/auctionController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = Router()

// 获取拍卖列表
router.get('/', getAuctions)

// 获取热门拍卖
router.get('/hot', getHotAuctions)

// 获取即将结束的拍卖
router.get('/ending-soon', getEndingSoonAuctions)

// 获取用户参与的拍卖
router.get('/my-bids', getMyBids)

// 获取用户创建的拍卖
router.get('/my-auctions', getMyAuctions)

// 获取拍卖详情
router.get('/:id', getAuctionById)

// 获取出价历史
router.get('/:auctionId/bids', getBidHistory)

// 创建拍卖（链下记录）
router.post('/', authMiddleware, [
  body('auctionId').isInt({ min: 0 }).withMessage('拍卖ID必须为非负整数'),
  body('artworkId').isInt({ min: 1 }).withMessage('艺术品ID不能为空'),
  body('startingPrice').isFloat({ min: 0 }).withMessage('起拍价必须为非负数'),
  body('duration').isInt({ min: 3600 }).withMessage('拍卖时长至少1小时')
], createAuction)

// 更新拍卖状态
router.put('/:auctionId/status', updateAuctionStatus)

// 记录出价
router.post('/bid', recordBid)

// 管理员接口：切换热门状态
router.put('/:id/hot', authMiddleware, roleMiddleware('admin'), toggleHotAuction)

// 管理员接口：物理删除拍卖
router.delete('/:id', authMiddleware, roleMiddleware('admin'), adminDeleteAuction)

export default router
