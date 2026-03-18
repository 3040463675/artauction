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
