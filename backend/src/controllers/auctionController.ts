import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Auction, Artwork, User, Bid, AuctionStatus } from '../models'
import { AppError } from '../middleware/error'

const AUCTION_DURATION_SECONDS = 15 * 24 * 60 * 60

// 获取拍卖列表
export const getAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      status,
      keyword,
      sortBy = 'endTime',
      includeSettled
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    const where: any = {}

    // 状态筛选：如果未指定状态，默认排除“已成交/已下架” (Settled = 4)
    if (status !== undefined && status !== '') {
      where.status = Number(status)
    } else if (!(String(includeSettled).toLowerCase() === 'true' || includeSettled === '1')) {
      where.status = { [Op.ne]: AuctionStatus.Settled }
    }

    // 默认只显示已审核的作品（非管理员请求时）
    const artworkWhere: any = { isVerified: true }

    // 模糊搜索作品名称或描述
    if (keyword) {
      where[Op.or] = [
        { '$artwork.name$': { [Op.like]: `%${keyword}%` } },
        { '$artwork.description$': { [Op.like]: `%${keyword}%` } },
        { auctionId: { [Op.like]: `%${keyword}%` } }
      ]
    }

    // 排序
    let order: any = [['createdAt', 'DESC']]
    if (sortBy === 'endTime') {
      order = [['endTime', 'ASC']]
    } else if (sortBy === 'highestBid') {
      order = [['highestBid', 'DESC']]
    } else if (sortBy === 'newest') {
      order = [['createdAt', 'DESC']]
    } else if (sortBy === 'priceDesc') {
      order = [['highestBid', 'DESC']]
    } else if (sortBy === 'priceAsc') {
      order = [['highestBid', 'ASC']]
    }

    const { count, rows } = await Auction.findAndCountAll({
      where,
      include: [
        {
          model: Artwork,
          as: 'artwork',
          required: true, // 强制 INNER JOIN，排除没有艺术品的无效拍卖
          where: artworkWhere,
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
      where: {
        [Op.or]: [
          { id: id },
          { auctionId: id }
        ]
      },
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
      where: {
        [Op.or]: [
          { auctionId: auctionId },
          { '$auction.id$': auctionId } // 也可以通过关联的数据库ID查找
        ]
      },
      include: [
        { 
          model: Auction, 
          as: 'auction',
          attributes: ['id', 'auctionId']
        },
        { model: User, as: 'bidder', attributes: ['id', 'address', 'username', 'avatar'] }
      ],
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
      where: { 
        status: AuctionStatus.Active, // 热门只显示进行中的
        isHot: true 
      },
      include: [
        { 
          model: Artwork, 
          as: 'artwork',
          required: true, // 确保作品存在
          where: { isVerified: true } 
        },
        { model: User, as: 'seller', attributes: ['id', 'address', 'username', 'avatar'] }
      ],
      order: [['highestBid', 'DESC']],
      limit: 12 
    })

    res.success(auctions)
  } catch (error) {
    next(error)
  }
}

// 切换热门状态 (管理员)
export const toggleHotAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { isHot } = req.body

    const auction = await Auction.findOne({
      where: {
        [Op.or]: [{ id: id }, { auctionId: id }]
      }
    })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    await auction.update({ isHot })
    res.success(auction)
  } catch (error) {
    next(error)
  }
}

// 物理删除拍卖 (管理员)
// 管理员物理删除拍卖（连带删除艺术品）
export const adminDeleteAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    console.log(`[Admin] 正在尝试删除拍卖 ID: ${id}`)

    // 1. 查找拍卖记录，支持数据库自增 ID 或业务 auctionId
    const auction = await Auction.findOne({
      where: {
        [Op.or]: [
          { id: id },
          { auctionId: id }
        ]
      }
    })

    if (!auction) {
      console.warn(`[Admin] 拍卖记录不存在: ${id}`)
      return res.success(null, '该记录已不存在或已被删除')
    }

    const artworkId = auction.artworkId
    console.log(`[Admin] 找到关联艺术品 ID: ${artworkId}`)

    // 2. 级联删除：先彻底清除该拍卖关联的所有出价
    await Bid.destroy({ where: { auctionId: auction.id } })

    // 3. 级联删除：处理艺术品及其所有场次（实现真正意义上的全站清除）
    if (artworkId) {
      // a. 找到该作品对应的所有其他拍卖 ID
      const otherAuctions = await Auction.findAll({ where: { artworkId }, attributes: ['id'] })
      const auctionIds = otherAuctions.map(a => a.id)
      
      // b. 清除这些拍卖的所有出价记录
      if (auctionIds.length > 0) {
        await Bid.destroy({ where: { auctionId: { [Op.in]: auctionIds } } })
      }

      // c. 删除该作品下的所有拍卖场次
      await Auction.destroy({ where: { artworkId } })

      // d. 物理删除艺术品记录
      await Artwork.destroy({ where: { id: artworkId } })
      console.log(`[Admin] 级联物理删除成功: Artwork(${artworkId})`)
    } else {
      // 如果没有关联艺术品，仅删除当前拍卖
      await auction.destroy()
      console.log(`[Admin] 仅删除孤立拍卖记录: ${id}`)
    }

    res.success(null, '该作品及其所有数据已彻底从系统同步移除')
  } catch (error) {
    console.error('[Admin] 物理删除失败:', error)
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
        status: AuctionStatus.Active, // 只获取进行中的
        endTime: { [Op.lte]: soonTime, [Op.gt]: now }
      },
      include: [
        { 
          model: Artwork, 
          as: 'artwork',
          required: true // 确保作品存在
        },
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
      txHash
    } = req.body

    // 检查是否已存在
    const existing = await Auction.findOne({ where: { auctionId } })
    if (existing) {
      throw new AppError('该拍卖ID已存在', -1, 400)
    }

    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + AUCTION_DURATION_SECONDS * 1000)

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

// 更新拍卖状态（用于链上事件同步或结算）
export const updateAuctionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params
    const { status, highestBid, highestBidder } = req.body

    const auction = await Auction.findOne({
      where: {
        [Op.or]: [{ id: auctionId }, { auctionId: auctionId }]
      }
    })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    const nextStatus = Number(status)

    await auction.update({
      status: nextStatus,
      highestBid: highestBid || auction.highestBid,
      highestBidder: highestBidder || auction.highestBidder
    })

    if (nextStatus === AuctionStatus.Settled) {
      const winner = highestBidder || auction.highestBidder || auction.sellerAddress
      await Artwork.update(
        { isOnAuction: false, ownerAddress: winner },
        { where: { id: auction.artworkId } }
      )
    } else if ([AuctionStatus.Ended, AuctionStatus.Cancelled].includes(nextStatus)) {
      await Artwork.update({ isOnAuction: false }, { where: { id: auction.artworkId } })
    } else if ([AuctionStatus.Pending, AuctionStatus.Active].includes(nextStatus)) {
      await Artwork.update({ isOnAuction: true }, { where: { id: auction.artworkId } })
    }

    res.success(auction)
  } catch (error) {
    next(error)
  }
}

// 记录出价
export const recordBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId, bidderAddress, amount, txHash } = req.body

    const auction = await Auction.findOne({
      where: {
        [Op.or]: [{ id: auctionId }, { auctionId: auctionId }]
      }
    })

    if (!auction) {
      throw new AppError('拍卖不存在', -1, 404)
    }

    // 关键校验：检查拍卖是否已结束
    const now = new Date()
    if (auction.status !== AuctionStatus.Active) {
      throw new AppError('拍卖当前不可参与（可能已结束或已结算）', -1, 400)
    }

    if (now > new Date(auction.endTime)) {
      // 自动标记为已结束
      await auction.update({ status: AuctionStatus.Ended })
      throw new AppError('拍卖已过结束时间', -1, 400)
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
      highestBidder: bidderAddress
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
          required: true, // 确保拍卖存在
          include: [{ 
            model: Artwork, 
            as: 'artwork',
            required: true // 确保作品存在
          }]
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
      include: [{ 
        model: Artwork, 
        as: 'artwork',
        required: true // 确保作品存在
      }],
      order: [['createdAt', 'DESC']]
    })

    res.success(auctions)
  } catch (error) {
    next(error)
  }
}
