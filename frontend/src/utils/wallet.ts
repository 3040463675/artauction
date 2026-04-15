import { ethers } from 'ethers'
import { useUserStore } from '@/stores/user'
import { request } from '@/api/request'

declare global {
  interface Window {
    ethereum?: any
  }
}

// 检查是否安装了MetaMask
export const checkMetaMask = (): boolean => {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
}

// 连接钱包
export const connectWallet = async (): Promise<string> => {
  if (!checkMetaMask()) {
    throw new Error('请先安装 MetaMask 钱包')
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const address = accounts[0]

    // 更新store地址
    const userStore = useUserStore()
    userStore.setAddress(address)

    // 调用统一的刷新余额方法
    await refreshBalance()

    // 获取链ID
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)
    userStore.setChainId(chainId)

    // 确保数据库中存在该用户地址并获取最新信息
    try {
      const res: any = await request.get('/auth/nonce', { params: { address } })
      // 如果后端返回了用户信息（说明是已存在的用户），更新到 store
      // 注意：这里可能需要根据你的登录逻辑调整，通常 nonce 接口不返回完整用户信息
      // 如果需要实时状态，可以在这里额外调用 /auth/me (如果已登录) 或在登录后处理
    } catch {
      // 忽略后端不可用时的错误
    }

    // 关键：登录后或连接后获取最新的用户信息（包含 enabled 状态）
    try {
      const meRes: any = await request.get('/auth/me')
      if (meRes.data) {
        userStore.setUserInfo(meRes.data)
      }
    } catch {
      // 未登录或 token 无效，跳过
    }

    return address
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('用户拒绝连接')
    }
    throw error
  }
}

// 刷新余额
export const refreshBalance = async () => {
  const userStore = useUserStore()
  if (!userStore.address || !checkMetaMask()) return

  try {
    const { ethers } = await import('ethers')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const bal = await provider.getBalance(userStore.address)
    userStore.setBalance(ethers.formatEther(bal))
  } catch (error) {
    console.error('Failed to refresh balance:', error)
  }
}

// 断开连接
export const disconnectWallet = () => {
  const userStore = useUserStore()
  userStore.clearUser()
}

// 切换到指定网络
export const switchNetwork = async (chainId: number): Promise<void> => {
  if (!checkMetaMask()) {
    throw new Error('请先安装 MetaMask 钱包')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    })
  } catch (error: any) {
    if (error.code === 4902) {
      await addNetwork(chainId)
    } else {
      throw error
    }
  }
}

// 添加网络
export const addNetwork = async (chainId: number): Promise<void> => {
  const networks: Record<number, any> = {
    31337: {
      chainId: '0x7a69',
      chainName: 'Hardhat Local',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['http://127.0.0.1:8545'],
      blockExplorerUrls: []
    },
    1337: {
      chainId: '0x539',
      chainName: 'Ganache Local',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['http://127.0.0.1:7545'],
      blockExplorerUrls: []
    },
    11155111: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia',
      nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.infura.io/v3/'],
      blockExplorerUrls: ['https://sepolia.etherscan.io/']
    },
    1: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io/']
    }
  }

  const network = networks[chainId]
  if (!network) {
    throw new Error('不支持的网络')
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [network]
  })
}

// 监听钱包事件
export const setupWalletListeners = () => {
  if (!checkMetaMask()) return

  const userStore = useUserStore()

  // 账户切换
  window.ethereum.on('accountsChanged', async (accounts: string[]) => {
    console.log('[Wallet] Accounts changed:', accounts)
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      userStore.setAddress(accounts[0])
      await refreshBalance()
    }
  })

  // 网络切换
  window.ethereum.on('chainChanged', (chainId: string) => {
    console.log('[Wallet] Chain changed:', chainId)
    userStore.setChainId(parseInt(chainId, 16))
    window.location.reload()
  })

  // 轮询余额以同步 MetaMask，并同步用户状态
  setInterval(async () => {
    if (userStore.isConnected) {
      await refreshBalance()
      
      // 同步后端最新的用户信息（包含封禁状态）
      try {
        const res: any = await request.get('/auth/me')
        if (res.data) {
          userStore.setUserInfo(res.data)
        }
      } catch (err) {
        // 如果 401 说明登录失效，不强制处理，由拦截器负责
      }
    }
  }, 5000)
}

// 获取Provider
export const getProvider = (): ethers.BrowserProvider => {
  if (!checkMetaMask()) {
    throw new Error('请先安装 MetaMask 钱包')
  }
  return new ethers.BrowserProvider(window.ethereum)
}

// 获取Signer
export const getSigner = async (): Promise<ethers.Signer> => {
  const provider = getProvider()
  return provider.getSigner()
}
