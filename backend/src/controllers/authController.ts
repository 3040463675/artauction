import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../models'
import { AppError } from '../middleware/error'

// 生成随机nonce
const generateNonce = () => {
  return uuidv4().replace(/-/g, '')
}

// 获取nonce（用于签名验证）
export const getNonce = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query

    if (!address) {
      throw new AppError('地址不能为空', -1, 400)
    }

    let user = await User.findOne({ where: { address: address as string } })

    if (!user) {
      // 创建新用户
      user = await User.create({
        address: address as string,
        nonce: generateNonce(),
        role: 'buyer'
      })
    } else {
      // 更新nonce
      user.nonce = generateNonce()
      await user.save()
    }

    res.success({
      nonce: user.nonce,
      message: `请使用钱包签名以下内容以验证身份:\n\n我正在登录 ArtChain 平台\n随机数: ${user.nonce}`
    })
  } catch (error) {
    next(error)
  }
}

// 验证签名并登录
export const verifySignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, signature, message } = req.body

    if (!address || !signature || !message) {
      throw new AppError('参数不完整', -1, 400)
    }

    // 查找用户
    const user = await User.findOne({ where: { address } })

    if (!user) {
      throw new AppError('用户不存在', -1, 404)
    }

    // 验证签名（这里简化处理，实际应使用ethers验证）
    // const ethers = require('ethers')
    // const recoveredAddress = ethers.verifyMessage(message, signature)
    // if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    //   throw new AppError('签名验证失败', -1, 401)
    // }

    // 更新nonce防止重放攻击
    user.nonce = generateNonce()
    await user.save()

    // 生成JWT
    const token = jwt.sign(
      {
        id: user.id,
        address: user.address,
        role: user.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.success({
      token,
      user: {
        id: user.id,
        address: user.address,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        enabled: user.enabled // 包含封禁状态
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('未授权', -1, 401)
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'address', 'username', 'avatar', 'email', 'role', 'bio', 'enabled', 'createdAt']
    })

    if (!user) {
      throw new AppError('用户不存在', -1, 404)
    }

    res.success(user)
  } catch (error) {
    next(error)
  }
}

// 更新用户信息
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('未授权', -1, 401)
    }

    const { username, email, bio, avatar } = req.body

    const user = await User.findByPk(req.user.id)

    if (!user) {
      throw new AppError('用户不存在', -1, 404)
    }

    await user.update({
      username: username || user.username,
      email: email || user.email,
      bio: bio || user.bio,
      avatar: avatar || user.avatar
    })

    res.success({
      id: user.id,
      address: user.address,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      role: user.role,
      bio: user.bio
    })
  } catch (error) {
    next(error)
  }
}
