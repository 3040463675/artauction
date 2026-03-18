import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Artwork, User, Category, Auction } from '../models'
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
        { model: User, as: 'creator', attributes: ['id', 'address', 'username', 'avatar'] }
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

    const artwork = await Artwork.findByPk(id)

    if (!artwork) {
      throw new AppError('艺术品不存在', -1, 404)
    }

    await artwork.update({ isVerified: true })

    res.success(artwork)
  } catch (error) {
    next(error)
  }
}
