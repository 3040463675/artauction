import { request } from './request'
import type { Auction, Bid, ApiResponse, PageData, PageParams } from '@/types'

// 获取拍卖列表
export const getAuctions = (params?: PageParams) => {
  return request.get<ApiResponse<PageData<Auction>>>('/auctions', { params })
}

// 获取拍卖详情
export const getAuctionById = (id: number) => {
  return request.get<ApiResponse<Auction>>(`/auctions/${id}`)
}

// 获取出价历史
export const getBidHistory = (auctionId: number) => {
  return request.get<ApiResponse<Bid[]>>(`/auctions/${auctionId}/bids`)
}

// 获取热门拍卖
export const getHotAuctions = () => {
  return request.get<ApiResponse<Auction[]>>('/auctions/hot')
}

// 获取即将结束的拍卖
export const getEndingSoonAuctions = () => {
  return request.get<ApiResponse<Auction[]>>('/auctions/ending-soon')
}

// 获取我参与的拍卖
export const getMyBids = (address: string) => {
  return request.get<ApiResponse<Auction[]>>('/auctions/my-bids', {
    params: { address }
  })
}

// 获取我创建的拍卖
export const getMyAuctions = (address: string) => {
  return request.get<ApiResponse<Auction[]>>('/auctions/my-auctions', {
    params: { address }
  })
}

// 管理员：切换热门状态
export const toggleHotAuction = (id: number, isHot: boolean) => {
  return request.put<ApiResponse<Auction>>(`/auctions/${id}/hot`, { isHot })
}

// 管理员：物理删除拍卖
export const deleteAuction = (id: number) => {
  return request.delete<ApiResponse<null>>(`/auctions/${id}`)
}

// 记录出价
export const recordBid = (data: {
  auctionId: number | string
  bidderAddress: string
  amount: string | number
  txHash?: string
}) => {
  return request.post<ApiResponse<{ success: true }>>('/auctions/bid', data)
}

// 更新拍卖状态
export const updateAuctionStatus = (auctionId: number | string, data: {
  status: number
  highestBid?: string | number
  highestBidder?: string
}) => {
  return request.put<ApiResponse<Auction>>(`/auctions/${auctionId}/status`, data)
}
