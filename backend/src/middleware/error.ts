import { Request, Response, NextFunction } from 'express'

// 自定义错误类
export class AppError extends Error {
  public code: number
  public status: number

  constructor(message: string, code: number = -1, status: number = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

// 错误处理中间件
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      data: null,
      timestamp: Date.now()
    })
  }

  // Sequelize 错误
  if ((err as any).name === 'SequelizeValidationError') {
    const messages = (err as any).errors.map((e: any) => e.message)
    return res.status(400).json({
      code: -1,
      message: messages.join(', '),
      data: null,
      timestamp: Date.now()
    })
  }

  // JWT 错误
  if ((err as any).name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: -1,
      message: '无效的token',
      data: null,
      timestamp: Date.now()
    })
  }

  if ((err as any).name === 'TokenExpiredError') {
    return res.status(401).json({
      code: -1,
      message: 'token已过期',
      data: null,
      timestamp: Date.now()
    })
  }

  // 默认错误
  return res.status(500).json({
    code: -1,
    message: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message,
    data: null,
    timestamp: Date.now()
  })
}

// 404处理
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: -1,
    message: `路由 ${req.method} ${req.path} 不存在`,
    data: null,
    timestamp: Date.now()
  })
}
