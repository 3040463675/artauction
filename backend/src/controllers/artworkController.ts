import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Artwork, User, Category, Auction, AuctionStatus } from '../models'
import { AppError } from '../middleware/error'

const AUCTION_DURATION_MS = 15 * 24 * 60 * 60 * 1000

// 获取艺术品列表
export const getArtworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      keyword,
      categoryId,
      status
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (status === 'on_auction') {
      where.isOnAuction = true
    } else if (status === 'verified') {
      where.isVerified = true
    } else if (status === 'pending') {
      where.status = 0
    } else if (status === 'approved') {
      where.status = 1
    } else if (status === 'sold') {
      where.status = 2
    } else if (status === 'rejected') {
      where.status = 3
    }

    const { count, rows } = await Artwork.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
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

// 获取艺术品详情
export const getArtworkById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const artwork = await Artwork.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        {
          model: Auction,
          as: 'auctions',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    })

    if (!artwork) {
      throw new AppError('艺术品不存在', -1, 404)
    }

    res.success(artwork)
  } catch (error) {
    next(error)
  }
}

// 获取用户的艺术品
export const getArtworksByOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, type } = req.query

    if (!address) {
      throw new AppError('地址不能为空', -1, 400)
    }

    const ownerAddress = String(address)
    const creatorUser = await User.findOne({ where: { address: ownerAddress }, attributes: ['id'] })
    const creatorId = creatorUser?.id

    // type: 'created' | 'owned' | 'all'，默认为 'created'
    const scope = String(type || 'created').toLowerCase()

    let whereCond: any = {}
    if (scope === 'owned') {
      whereCond = { ownerAddress: ownerAddress }
    } else if (scope === 'all') {
      whereCond = creatorId
        ? { [Op.or]: [{ ownerAddress: ownerAddress }, { creatorId }] }
        : { ownerAddress: ownerAddress }
    } else {
      // 默认仅返回我发布的作品（创作者）
      whereCond = creatorId ? { creatorId } : { creatorId: -1 } // 若找不到用户ID则返回空集
    }

    const artworks = await Artwork.findAll({
      where: whereCond,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] },
        { model: Auction, as: 'auctions', required: false, attributes: ['id', 'auctionId', 'status', 'highestBidder', 'createdAt', 'updatedAt'] }
      ],
      order: [['createdAt', 'DESC']]
    })

    res.success(artworks)
  } catch (error) {
    next(error)
  }
}

// 创建艺术品记录（链下数据同步）
export const createArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('未授权', -1, 401)
    }

    const { tokenId, name, description, imageUrl, ipfsHash, categoryId, metadata } = req.body

    // 检查是否已存在
    const existing = await Artwork.findOne({ where: { tokenId } })
    if (existing) {
      throw new AppError('该Token ID已存在', -1, 400)
    }

    const artwork = await Artwork.create({
      tokenId,
      name,
      description,
      imageUrl,
      ipfsHash,
      creatorId: req.user.id,
      ownerAddress: req.user.address,
      categoryId,
      metadata,
      isVerified: false,
      isOnAuction: false,
      status: 0, // 待审核
      auditReason: null
    })

    res.success(artwork)
  } catch (error) {
    next(error)
  }
}

// 更新艺术品信息
export const updateArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, description, categoryId, metadata } = req.body

    const artwork = await Artwork.findByPk(id)

    if (!artwork) {
      throw new AppError('艺术品不存在', -1, 404)
    }

    const updateData: any = {
      name: name || artwork.name,
      description: description || artwork.description,
      categoryId: categoryId || artwork.categoryId,
      metadata: metadata || artwork.metadata
    }

    // 如果是被驳回的作品重新提交，重置状态为待审核
    if (artwork.status === 3) {
      updateData.status = 0
      updateData.auditReason = null
    }

    await artwork.update(updateData)

    res.success(artwork)
  } catch (error) {
    next(error)
  }
}

// 验证艺术品（拍卖行权限）
export const verifyArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { isVerified = true } = req.body

    const artwork = await Artwork.findByPk(id)

    if (!artwork) {
      throw new AppError('艺术品不存在', -1, 404)
    }

    const metadata = artwork.metadata && typeof artwork.metadata === 'object' ? artwork.metadata as any : {}
    const startingPriceNum = Number(metadata.startingPrice)
    const minIncrementNum = Number(metadata.minIncrement)
    const startingPrice = (Number.isFinite(startingPriceNum) && startingPriceNum > 0 ? startingPriceNum : 0.1).toString()
    const minIncrement = (Number.isFinite(minIncrementNum) && minIncrementNum > 0 ? minIncrementNum : 0.01).toString()

    if (isVerified) {
      const activeAuction = await Auction.findOne({
        where: {
          artworkId: artwork.id,
          status: { [Op.in]: [AuctionStatus.Pending, AuctionStatus.Active] }
        }
      })

      if (!activeAuction) {
        const latestAuction = await Auction.findOne({
          attributes: ['auctionId'],
          order: [['auctionId', 'DESC']]
        })
        const nextAuctionId = (Number(latestAuction?.auctionId) || 0) + 1
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + AUCTION_DURATION_MS)

        await Auction.create({
          auctionId: nextAuctionId,
          artworkId: artwork.id,
          sellerAddress: artwork.ownerAddress,
          startingPrice,
          reservePrice: '0',
          minIncrement,
          startTime,
          endTime,
          highestBid: startingPrice, // 审核通过时，最高价初始化为起拍价
          status: AuctionStatus.Active
        })
      } else if (activeAuction.status === AuctionStatus.Pending) {
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + AUCTION_DURATION_MS)
        await activeAuction.update({
          status: AuctionStatus.Active,
          startingPrice,
          highestBid: startingPrice, // 同样同步更新最高价
          minIncrement,
          startTime,
          endTime
        })
      }

      await artwork.update({ 
        isVerified: true, 
        isOnAuction: true,
        status: 1, // 已通过
        auditReason: null 
      })
    } else {
      await artwork.update({ 
        isVerified: false, 
        isOnAuction: false,
        status: 0 // 撤回审核后变回待审核状态
      })
      await Auction.update(
        { status: AuctionStatus.Cancelled },
        {
          where: {
            artworkId: artwork.id,
            status: { [Op.in]: [AuctionStatus.Pending, AuctionStatus.Active] }
          }
        }
      )
    }

    res.success(artwork)
  } catch (error) {
    next(error)
  }
}

// 驳回艺术品（管理员权限）
export const rejectArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    
    if (!req.user) throw new AppError('未授权', -1, 401)

    const artwork = await Artwork.findByPk(id)
    if (!artwork) throw new AppError('艺术品不存在', -1, 404)

    // 状态变更为已驳回
    await artwork.update({
      status: 3, // 已驳回
      auditReason: reason || '不符合平台要求',
      isVerified: false,
      isOnAuction: false
    })
    
    // 取消关联的未开始或正在进行的拍卖
    await Auction.update(
      { status: AuctionStatus.Cancelled },
      {
        where: {
          artworkId: id,
          status: { [Op.in]: [AuctionStatus.Pending, AuctionStatus.Active] }
        }
      }
    )
    
    res.success(artwork, '作品已驳回')
  } catch (error) {
    next(error)
  }
}

// 删除艺术品 (用户级)
export const deleteArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!req.user) throw new AppError('未授权', -1, 401)

    const artwork = await Artwork.findByPk(id)
    if (!artwork) throw new AppError('艺术品不存在', -1, 404)

    // 只能删除自己的作品
    if (artwork.ownerAddress.toLowerCase() !== req.user.address.toLowerCase()) {
      throw new AppError('您无权删除此作品', -1, 403)
    }

    // 如果正在拍卖中，不允许删除
    if (artwork.isOnAuction) {
      throw new AppError('该作品正在拍卖中，无法删除', -1, 400)
    }

    await artwork.destroy()
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}

// 终止拍卖（所有者权限）
export const terminateAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!req.user) throw new AppError('未授权', -1, 401)

    const artwork = await Artwork.findByPk(id)
    if (!artwork) throw new AppError('艺术品不存在', -1, 404)

    // 只能由所有者终止
    if (artwork.ownerAddress.toLowerCase() !== req.user.address.toLowerCase()) {
      throw new AppError('只有作品所有者可以终止拍卖', -1, 403)
    }

    // 更新作品状态为已终止
    await artwork.update({
      status: 4, // 已终止
      isOnAuction: false,
      isVerified: false
    })

    // 同步取消关联的正在进行或待开始的拍卖
    await Auction.update(
      { status: AuctionStatus.Cancelled },
      {
        where: {
          artworkId: id,
          status: { [Op.in]: [AuctionStatus.Pending, AuctionStatus.Active] }
        }
      }
    )

    res.success(artwork, '拍卖已终止')
  } catch (error) {
    next(error)
  }
}
