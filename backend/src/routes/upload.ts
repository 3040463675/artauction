import { Router } from 'express'
import { upload, uploadImage, uploadImages } from '../controllers/uploadController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 上传单个图片
router.post('/image', upload.single('file'), uploadImage)

// 上传多张图片
router.post('/images', upload.array('files', 5), uploadImages)

export default router
