import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { User } from '../models'
import { AppError } from '../middleware/error'

// 获取所有用户列表 (管理员)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      role
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (role) {
      where.role = role
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'address', 'username', 'avatar', 'email', 'role', 'enabled', 'createdAt'],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    })

    // 模拟余额数据（实际项目中应从区块链获取）
    const list = rows.map(user => ({
      ...user.toJSON(),
      balance: (Math.random() * 10).toFixed(2) // 演示用模拟余额
    }))

    res.success({
      list,
      total: count,
      page: Number(page),
      pageSize: limit
    })
  } catch (error) {
    next(error)
  }
}

// 修改用户角色 (管理员)
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['admin', 'auction_house', 'seller', 'buyer'].includes(role)) {
      throw new AppError('无效的角色类型', -1, 400)
    }

    const user = await User.findByPk(id)
    if (!user) {
      throw new AppError('用户不存在', -1, 404)
    }

    await user.update({ role })

    res.success(user)
  } catch (error) {
    next(error)
  }
}

// 更新用户启用状态（封禁/解封）
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    if (typeof enabled !== 'boolean') {
      throw new AppError('参数 enabled 必须为布尔值', -1, 400)
    }
    const user = await User.findByPk(id)
    if (!user) {
      throw new AppError('用户不存在', -1, 404)
    }
    await user.update({ enabled })
    res.success({ id: user.id, enabled: user.enabled })
  } catch (error) {
    next(error)
  }
}
