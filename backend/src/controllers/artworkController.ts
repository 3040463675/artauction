import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Artwork, User, Category, Auction, AuctionStatus } from '../models'
import { AppError } from '../middleware/error'

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
    const { address } = req.query

    if (!address) {
      throw new AppError('地址不能为空', -1, 400)
    }

    const artworks = await Artwork.findAll({
      where: { ownerAddress: address },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] },
        { model: Auction, as: 'auctions', required: false, attributes: ['id', 'auctionId', 'status', 'createdAt'] }
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
      isOnAuction: false
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
    const { name, description, categoryId } = req.body

    const artwork = await Artwork.findByPk(id)

    if (!artwork) {
      throw new AppError('艺术品不存在', -1, 404)
    }

    await artwork.update({
      name: name || artwork.name,
      description: description || artwork.description,
      categoryId: categoryId || artwork.categoryId
    })

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
        const endTime = new Date(startTime.getTime() + 3 * 24 * 60 * 60 * 1000)

        await Auction.create({
          auctionId: nextAuctionId,
          artworkId: artwork.id,
          sellerAddress: artwork.ownerAddress,
          startingPrice,
          reservePrice: '0',
          minIncrement,
          startTime,
          endTime,
          highestBid: '0',
          status: AuctionStatus.Active
        })
      } else if (activeAuction.status === AuctionStatus.Pending) {
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + 3 * 24 * 60 * 60 * 1000)
        await activeAuction.update({
          status: AuctionStatus.Active,
          startingPrice,
          minIncrement,
          startTime,
          endTime
        })
      }

      await artwork.update({ isVerified: true, isOnAuction: true })
    } else {
      await artwork.update({ isVerified: false, isOnAuction: false })
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

// 驳回并删除艺术品（管理员权限）
export const rejectArtwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!req.user) throw new AppError('未授权', -1, 401)

    const artwork = await Artwork.findByPk(id)
    if (!artwork) throw new AppError('艺术品不存在', -1, 404)

    // 删除关联的拍卖
    await Auction.destroy({ where: { artworkId: id } })
    
    // 物理删除作品
    await artwork.destroy()
    
    res.success(null, '驳回成功，作品已移除')
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
