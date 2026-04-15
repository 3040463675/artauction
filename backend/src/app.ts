import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { Op } from 'sequelize'

// 加载环境变量
dotenv.config()

// 导入路由
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import artworkRoutes from './routes/artwork'
import auctionRoutes from './routes/auction'
import uploadRoutes from './routes/upload'

// 导入中间件
import { errorHandler, notFoundHandler } from './middleware/error'
import { responseFormatter } from './middleware/response'
import { setupAssociations } from './models'

// 创建Express应用
const app = express()

// 基础中间件
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}))
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'http://10.216.80.84:3000' // 允许局域网 IP 访问
      ],
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 响应格式化中间件
app.use(responseFormatter)

// 注册路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/artworks', artworkRoutes)
app.use('/api/auctions', auctionRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.success({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==========================================
// 后台定时任务
// ==========================================

// 自动结算超时拍卖
const startAutoSettleJob = async () => {
  const { Auction, Bid, Artwork, sequelize } = await import('./models')

  const job = async () => {
    try {
      const now = new Date()

      // 查找已过结束时间但仍处于 Active 状态的拍卖
      const expiredAuctions = await Auction.findAll({
        where: {
          status: 1, // Active
          endTime: { [Op.lte]: now }
        }
      })

      for (const auction of expiredAuctions) {
        // 获取该拍卖的最高出价
        const topBid = await Bid.findOne({
          where: { auctionId: auction.id },
          order: [['createdAt', 'DESC']]
        })

        const winner = topBid?.bidderAddress || null
        const winAmount = topBid?.amount || auction.highestBid || '0'

        // 更新拍卖状态为已结算
        await auction.update({
          status: 4, // Settled
          highestBid: winAmount,
          highestBidder: winner
        })

        // 更新艺术品状态
        if (winner) {
          await Artwork.update(
            { isOnAuction: false, ownerAddress: winner },
            { where: { id: auction.artworkId } }
          )
        } else {
          await Artwork.update(
            { isOnAuction: false },
            { where: { id: auction.artworkId } }
          )
        }

        console.log(`[AutoSettle] 拍卖 ${auction.id} 已自动结算 - 赢家: ${winner || '无'}, 金额: ${winAmount}`)
      }

      // 查找超过3分钟无新出价且有人出价的 Active 拍卖
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000)

      const inactiveAuctions = await Auction.findAll({
        where: {
          status: 1, // Active
          updatedAt: { [Op.lte]: threeMinutesAgo }
        }
      })

      for (const auction of inactiveAuctions) {
        // 获取该拍卖的最高出价
        const topBid = await Bid.findOne({
          where: { auctionId: auction.id },
          order: [['createdAt', 'DESC']]
        })

        if (!topBid) {
          // 如果没有任何出价，跳过
          continue
        }

        const winner = topBid.bidderAddress
        const winAmount = topBid.amount

        // 更新拍卖状态为已结算
        await auction.update({
          status: 4, // Settled
          highestBid: winAmount,
          highestBidder: winner
        })

        // 更新艺术品状态
        await Artwork.update(
          { isOnAuction: false, ownerAddress: winner },
          { where: { id: auction.artworkId } }
        )

        console.log(`[AutoSettle] 拍卖 ${auction.id} 因3分钟无活动已自动结算 - 赢家: ${winner}, 金额: ${winAmount}`)
      }
    } catch (error) {
      console.error('[AutoSettle] 定时任务执行失败:', error)
    }
  }

  // 每 10 秒执行一次
  setInterval(job, 10000)
  console.log('[AutoSettle] 自动结算定时任务已启动 (每10秒检查一次)')

  // 立即执行一次
  job()
}

// API信息
app.get('/api', (req, res) => {
  res.success({
    name: 'Art Auction API',
    version: '1.0.0',
    description: '基于区块链的艺术品竞拍系统API'
  })
})

// 错误处理
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务器
const PORT = process.env.PORT || 8081

const startServer = async () => {
  try {
    // 设置模型关联
    setupAssociations()
    
    // 测试数据库连接
    const { sequelize } = await import('./config/database')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    // 同步模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      // 使用普通的 sync() 而不是 { alter: true }，避免由于外键约束名称冲突导致的启动失败
      // 如果需要更新表结构，请运行 npm run db:init (注意这会清空数据)
      await sequelize.sync()
      console.log('✅ 数据库模型同步完成')
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在:`)
      console.log(`   - 本地:   http://localhost:${PORT}`)
      console.log(`   - 局域网: http://10.216.80.84:${PORT}`)
      console.log(`📚 API文档: http://10.216.80.84:${PORT}/api`)
    })

    // 启动后台定时任务
    startAutoSettleJob()
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

export default app
