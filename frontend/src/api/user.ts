import { request } from './request'
import type { User, ApiResponse } from '@/types'

// 用户登录/注册
export const login = (address: string) => {
  return request.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    address
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get<ApiResponse<User>>('/user/info')
}

// 更新用户信息
export const updateUserInfo = (data: Partial<User>) => {
  return request.put<ApiResponse<User>>('/user/info', data)
}

// 获取用户nonce（用于签名验证）
export const getNonce = (address: string) => {
  return request.get<ApiResponse<{ nonce: string }>>('/auth/nonce', {
    params: { address }
  })
}

// 验证签名
export const verifySignature = (address: string, signature: string) => {
  return request.post<ApiResponse<{ token: string; user: User }>>(
    '/auth/verify',
    { address, signature }
  )
}
