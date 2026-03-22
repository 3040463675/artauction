import { request } from './request'
import type { Artwork, ApiResponse, PageData, PageParams } from '@/types'

// 获取艺术品列表
export const getArtworks = (params?: PageParams) => {
  return request.get<ApiResponse<PageData<Artwork>>>('/artworks', { params })
}

// 获取艺术品详情
export const getArtworkById = (id: number) => {
  return request.get<ApiResponse<Artwork>>(`/artworks/${id}`)
}

// 获取用户的艺术品
export const getArtworksByOwner = (address: string) => {
  return request.get<ApiResponse<Artwork[]>>('/artworks/owner', {
    params: { address }
  })
}

// 上传艺术品图片
export const uploadArtworkImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<ApiResponse<{ url: string; ipfsHash: string }>>(
    '/artworks/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}

// 创建艺术品记录（链下数据）
export const createArtwork = (data: Partial<Artwork>) => {
  return request.post<ApiResponse<Artwork>>('/artworks', data)
}

// 更新艺术品信息
export const updateArtwork = (id: number, data: Partial<Artwork>) => {
  return request.put<ApiResponse<Artwork>>(`/artworks/${id}`, data)
}

// 审核作品 (通过/撤回)
export const verifyArtwork = (id: number | string, isVerified: boolean = true) => {
  return request.post<ApiResponse<null>>(`/artworks/${id}/verify`, { isVerified })
}

// 驳回作品 (物理删除或标记驳回)
export const rejectArtwork = (id: number | string) => {
  return request.post<ApiResponse<null>>(`/artworks/${id}/reject`)
}

// 删除艺术品
export const deleteArtwork = (id: number | string) => {
  return request.delete<ApiResponse<null>>(`/artworks/${id}`)
}
