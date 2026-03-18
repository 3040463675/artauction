import { Request, Response, NextFunction } from 'express'

// 统一响应格式中间件
export const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  // 成功响应
  res.success = (data: any = null, message = '操作成功') => {
    return res.json({
      code: 0,
      message,
      data,
      timestamp: Date.now()
    })
  }

  // 错误响应
  res.error = (message = '操作失败', code = -1, data: any = null) => {
    return res.status(400).json({
      code,
      message,
      data,
      timestamp: Date.now()
    })
  }

  next()
}

// 扩展Response类型
declare module 'express' {
  interface Response {
    success: (data?: any, message?: string) => Response
    error: (message?: string, code?: number, data?: any) => Response
  }
}
