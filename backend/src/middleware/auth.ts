import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error'

// 扩展Request类型
declare module 'express' {
  interface Request {
    user?: {
      id: number
      address: string
      role: string
    }
  }
}

// JWT认证中间件
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未授权，请先登录', -1, 401)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

    req.user = {
      id: decoded.id,
      address: decoded.address,
      role: decoded.role
    }

    next()
  } catch (error) {
    next(error)
  }
}

// 角色权限中间件
export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('未授权', -1, 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', -1, 403))
    }

    next()
  }
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

      req.user = {
        id: decoded.id,
        address: decoded.address,
        role: decoded.role
      }
    }

    next()
  } catch (error) {
    // 忽略错误，继续执行
    next()
  }
}
