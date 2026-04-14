import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const address = ref<string>('')
  const balance = ref<string>('0')
  const chainId = ref<number>(0)
  const isConnected = computed(() => !!address.value)

  // 角色
  const role = ref<'admin' | 'auction_house' | 'seller' | 'buyer'>('buyer')
  const userInfo = ref<any>(null)

  // 设置地址
  const setAddress = (addr: string) => {
    address.value = addr
  }

  // 设置余额
  const setBalance = (bal: string) => {
    if (!bal || isNaN(Number(bal))) {
      console.warn('[UserStore] Invalid balance update:', bal)
      return
    }
    balance.value = bal
  }

  // 设置链ID
  const setChainId = (id: number) => {
    chainId.value = id
  }

  // 设置角色
  const setRole = (r: 'admin' | 'auction_house' | 'seller' | 'buyer') => {
    role.value = r
  }

  // 设置用户信息
  const setUserInfo = (info: any) => {
    userInfo.value = info
  }

  // 刷新余额
  const refreshBalance = async () => {
    if (!address.value) return
    try {
      const { ethers } = await import('ethers')
      if (!window.ethereum) return
      const provider = new ethers.BrowserProvider(window.ethereum)
      const bal = await provider.getBalance(address.value)
      // 获取完整精度余额
      balance.value = ethers.formatEther(bal)
      console.log(`[Balance] Refreshed: ${balance.value} ETH for ${address.value}`)
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  // 清除用户数据
  const clearUser = () => {
    address.value = ''
    balance.value = '0'
    chainId.value = 0
    role.value = 'buyer'
    userInfo.value = null
  }

  return {
    address,
    balance,
    chainId,
    isConnected,
    role,
    userInfo,
    setAddress,
    setBalance,
    setChainId,
    setRole,
    setUserInfo,
    refreshBalance,
    clearUser
  }
}, {
  persist: {
    key: 'user-store',
    paths: ['address', 'role']
  }
})
