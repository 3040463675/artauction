import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error'
import { User } from '../models'

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
const getSingleHeader = (value: string | string[] | undefined) => {
  if (!value) return ''
  if (Array.isArray(value)) return value[0] || ''
  return value
}

const resolveUserFromHeaders = async (req: Request) => {
  const address = getSingleHeader(req.headers['x-user-address']).trim()
  if (!address) return null

  const headerRole = getSingleHeader(req.headers['x-user-role']).trim()
  const validRoles = ['admin', 'auction_house', 'seller', 'buyer']
  const role = validRoles.includes(headerRole) ? headerRole : 'buyer'
  const [user] = await User.findOrCreate({
    where: { address },
    defaults: { address, role: role as any }
  })

  return {
    id: user.id,
    address: user.address,
    role
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
      next()
      return
    }

    const userFromHeaders = await resolveUserFromHeaders(req)
    if (userFromHeaders) {
      req.user = userFromHeaders
      next()
      return
    }
    throw new AppError('未授权，请先登录', -1, 401)
  } catch (error) {
    next(error)
  }
}

// 角色权限中间件
export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerRole = req.headers['x-user-role']
    const roleFromHeader = Array.isArray(headerRole) ? headerRole[0] : headerRole

    if (!req.user && roleFromHeader) {
      req.user = {
        id: 0,
        address: '',
        role: roleFromHeader
      }
    }

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

    if (!req.user) {
      resolveUserFromHeaders(req).then((user) => {
        if (user) {
          req.user = user
        }
        next()
      }).catch(() => {
        next()
      })
      return
    }

    next()
  } catch (error) {
    // 忽略错误，继续执行
    next()
  }
}
