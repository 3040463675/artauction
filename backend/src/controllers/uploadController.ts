import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '../middleware/error'

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dateDir = path.join(uploadDir, new Date().toISOString().split('T')[0])
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true })
    }
    cb(null, dateDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  }
})

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'))
  }
}

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
  }
})

// 上传单个图片
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('请选择要上传的文件', -1, 400)
    }

    const file = req.file
    const relativePath = path.relative(uploadDir, file.path).replace(/\\/g, '/')
    const url = `/uploads/${relativePath}`

    res.success({
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    })
  } catch (error) {
    next(error)
  }
}

// 上传多张图片
export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError('请选择要上传的文件', -1, 400)
    }

    const files = req.files as Express.Multer.File[]
    const results = files.map(file => {
      const relativePath = path.relative(uploadDir, file.path).replace(/\\/g, '/')
      return {
        url: `/uploads/${relativePath}`,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }
    })

    res.success(results)
  } catch (error) {
    next(error)
  }
}
