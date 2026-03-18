import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'

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
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
const PORT = process.env.PORT || 8080

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
      await sequelize.sync({ alter: true })
      console.log('✅ 数据库模型同步完成')
    }

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
      console.log(`📚 API文档: http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

export default app
