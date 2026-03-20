// 用户角色
export type UserRole = 'admin' | 'auction_house' | 'seller' | 'buyer'

// 拍卖状态
export enum AuctionStatus {
  Pending = 0,   // 待开始
  Active = 1,    // 进行中
  Ended = 2,     // 已结束
  Cancelled = 3, // 已取消
  Settled = 4    // 已结算
}

// 艺术品信息
export interface Artwork {
  id?: string | number
  tokenId: number | string
  creator: string
  name: string
  description: string
  imageUrl: string
  ipfsHash?: string
  createdAt?: number | string
  isVerified: boolean
  isOnAuction?: boolean
  owner?: string
}

// 拍卖信息
export interface Auction {
  id?: string | number
  auctionId: number | string
  tokenId?: number | string
  artwork?: Artwork
  sellerAddress?: string
  startingPrice: string
  reservePrice?: string
  minIncrement: string
  startTime?: number | string
  endTime: number | string
  highestBid: string
  highestBidder?: string
  status: AuctionStatus
  txHash?: string
  createdAt?: number | string
}

// 出价记录
export interface Bid {
  id?: string | number
  auctionId: number | string
  bidderAddress: string
  amount: string
  txHash?: string
  createdAt: string | number
}

// 用户信息
export interface User {
  id?: string | number
  address: string
  username?: string
  avatar?: string
  role: UserRole
  email?: string
  createdAt?: string | number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页数据
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 分页参数
export interface PageParams {
  page?: number
  pageSize?: number
  status?: AuctionStatus
  keyword?: string
}
