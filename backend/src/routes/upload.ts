import { Router } from 'express'
import { upload, uploadImage, uploadImages } from '../controllers/uploadController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 上传单个图片
router.post('/image', authMiddleware, upload.single('file'), uploadImage)

// 上传多张图片
router.post('/images', authMiddleware, upload.array('files', 5), uploadImages)

export default router
