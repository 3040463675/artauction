import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Auction, Artwork, User, Bid, AuctionStatus } from '../models'
import { AppError } from '../middleware/error'

// 获取拍卖列表
export const getAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      status,
      keyword,
      sortBy = 'endTime'
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    const where: any = {}

    // 状态筛选
    if (status !== undefined && status !== '') {
      where.status = Number(status)
    }

    // 排序
    let order: any = [['createdAt', 'DESC']]
    if (sortBy === 'endTime') {
      order = [['endTime', 'ASC']]
    } else if (sortBy === 'highestBid') {
      order = [['highestBid', 'DESC']]
    } else if (sortBy === 'newest') {
      order = [['createdAt', 'DESC']]
    }

    const { count, rows } = await Auction.findAndCountAll({
      where,
      include: [
        {
          model: Artwork,
          as: 'artwork',
          include: [{ model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] }]
        },
        { model: User, as: 'seller', attributes: ['id', 'address', 'username', 'avatar'] }
      ],
      order,
      offset,
      limit
    })

    res.success({
      list: rows,
      total: count,
      page: Number(page),
      pageSize: limit
    })
  } catch (error) {
    next(error)
  }
}

// 获取拍卖详情
export const getAuctionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const auction = await Auction.findOne({
      where: { id },
      include: [
        {
          model: Artwork,
          as: 'artwork',
          include: [{ model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] }]
        },
        { model: User, as: 'seller', attributes: ['id', 'address', 'username', 'avatar'] }
      ]
    })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    res.success(auction)
  } catch (error) {
    next(error)
  }
}

// 获取出价历史
export const getBidHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params

    const bids = await Bid.findAll({
      where: { auctionId },
      include: [{ model: User, as: 'bidder', attributes: ['id', 'address', 'username', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    })

    res.success(bids)
  } catch (error) {
    next(error)
  }
}

// 获取热门拍卖
export const getHotAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctions = await Auction.findAll({
      where: { status: AuctionStatus.Active },
      include: [
        { model: Artwork, as: 'artwork' },
        { model: User, as: 'seller', attributes: ['id', 'address', 'username', 'avatar'] }
      ],
      order: [['highestBid', 'DESC']],
      limit: 8
    })

    res.success(auctions)
  } catch (error) {
    next(error)
  }
}

// 获取即将结束的拍卖
export const getEndingSoonAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date()
    const soonTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时内

    const auctions = await Auction.findAll({
      where: {
        status: AuctionStatus.Active,
        endTime: { [Op.lte]: soonTime, [Op.gt]: now }
      },
      include: [
        { model: Artwork, as: 'artwork' },
        { model: User, as: 'seller', attributes: ['id', 'address', 'username', 'avatar'] }
      ],
      order: [['endTime', 'ASC']],
      limit: 8
    })

    res.success(auctions)
  } catch (error) {
    next(error)
  }
}

// 创建拍卖（链下记录）
export const createAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('未授权', -1, 401)
    }

    const {
      auctionId,
      artworkId,
      startingPrice,
      reservePrice,
      minIncrement,
      duration,
      txHash
    } = req.body

    // 检查是否已存在
    const existing = await Auction.findOne({ where: { auctionId } })
    if (existing) {
      throw new AppError('该拍卖ID已存在', -1, 400)
    }

    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 1000)

    const auction = await Auction.create({
      auctionId,
      artworkId,
      sellerAddress: req.user.address,
      startingPrice,
      reservePrice,
      minIncrement,
      startTime,
      endTime,
      highestBid: '0',
      status: AuctionStatus.Pending,
      txHash
    })

    // 更新艺术品状态
    await Artwork.update({ isOnAuction: true }, { where: { id: artworkId } })

    res.success(auction)
  } catch (error) {
    next(error)
  }
}

// 更新拍卖状态（用于链上事件同步）
export const updateAuctionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params
    const { status, highestBid, highestBidder } = req.body

    const auction = await Auction.findOne({ where: { auctionId } })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    await auction.update({
      status,
      highestBid: highestBid || auction.highestBid,
      highestBidder: highestBidder || auction.highestBidder
    })

    res.success(auction)
  } catch (error) {
    next(error)
  }
}

// 记录出价
export const recordBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId, bidderAddress, amount, txHash } = req.body

    const auction = await Auction.findOne({ where: { auctionId } })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    // 创建出价记录
    await Bid.create({
      auctionId: auction.id,
      bidderAddress,
      amount,
      txHash
    })

    // 更新拍卖信息
    await auction.update({
      highestBid: amount,
      highestBidder: bidderAddress,
      status: AuctionStatus.Active
    })

    res.success({ success: true })
  } catch (error) {
    next(error)
  }
}

// 获取用户参与的拍卖
export const getMyBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query

    if (!address) {
      throw new AppError('地址不能为空', -1, 400)
    }

    // 查找出价记录
    const bids = await Bid.findAll({
      where: { bidderAddress: address },
      include: [
        {
          model: Auction,
          as: 'auction',
          include: [{ model: Artwork, as: 'artwork' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    })

    // 去重获取拍卖列表
    const auctionMap = new Map()
    bids.forEach((bid: any) => {
      if (!auctionMap.has(bid.auctionId)) {
        auctionMap.set(bid.auctionId, bid.auction)
      }
    })

    res.success(Array.from(auctionMap.values()))
  } catch (error) {
    next(error)
  }
}

// 获取用户创建的拍卖
export const getMyAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query

    if (!address) {
      throw new AppError('地址不能为空', -1, 400)
    }

    const auctions = await Auction.findAll({
      where: { sellerAddress: address },
      include: [{ model: Artwork, as: 'artwork' }],
      order: [['createdAt', 'DESC']]
    })

    res.success(auctions)
  } catch (error) {
    next(error)
  }
}
