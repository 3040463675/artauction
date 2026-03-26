import { request } from './request'

export const getUsers = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  role?: string
}) => {
  return request.get('/user', { params })
}

export const updateUserRole = (id: number | string, role: 'admin' | 'auction_house' | 'seller' | 'buyer') => {
  return request.put(`/user/${id}/role`, { role })
}

export const updateUserStatus = (id: number | string, enabled: boolean) => {
  return request.patch(`/user/${id}/status`, { enabled })
}
