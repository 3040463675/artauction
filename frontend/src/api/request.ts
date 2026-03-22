import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const persistedUser = localStorage.getItem('user-store')
    if (persistedUser) {
      try {
        const user = JSON.parse(persistedUser)
        const state = user?.state || user
        if (state?.role) {
          config.headers['x-user-role'] = state.role
        }
        if (state?.address) {
          config.headers['x-user-address'] = state.address
        }
      } catch {
      }
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果是直接返回文件或特殊格式
    if (response.config.responseType === 'blob') {
      return response
    }

    // 业务错误处理
    if (res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error) => {
    console.error('Response error:', error)

    if (error.response) {
      switch (error.response.status) {
        case 401:
          if (!localStorage.getItem('token')) {
            ElMessage.error('会话已过期，请重新连接钱包')
          } else {
            ElMessage.error('未授权操作或登录失效')
          }
          localStorage.removeItem('token')
          break
        case 403:
          ElMessage.error('权限不足：您的账号没有管理员权限')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误，请联系管理员')
          break
        default:
          ElMessage.error(error.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config)
  }
}

export default service
