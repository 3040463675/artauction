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

    // 获取余额
    const balance = await provider.getBalance(address)
    const formattedBalance = ethers.formatEther(balance)

    // 获取链ID
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)

    // 更新store
    const userStore = useUserStore()
    userStore.setAddress(address)
    userStore.setBalance(formattedBalance.slice(0, 6))
    userStore.setChainId(chainId)

    // 确保数据库中存在该用户地址（触发后端创建或更新nonce）
    try {
      await request.get('/auth/nonce', { params: { address } })
    } catch {
      // 忽略后端不可用时的错误，保持前端连接流程不被打断
    }

    return address
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('用户拒绝连接')
    }
    throw error
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
    // 如果网络不存在，添加网络
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
    // Hardhat 本地网络
    31337: {
      chainId: '0x7a69',
      chainName: 'Hardhat Local',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['http://127.0.0.1:8545'],
      blockExplorerUrls: []
    },
    // Ganache 本地网络
    1337: {
      chainId: '0x539',
      chainName: 'Ganache Local',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['http://127.0.0.1:7545'],
      blockExplorerUrls: []
    },
    // Sepolia 测试网
    11155111: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia',
      nativeCurrency: {
        name: 'SepoliaETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://sepolia.infura.io/v3/'],
      blockExplorerUrls: ['https://sepolia.etherscan.io/']
    },
    // 以太坊主网
    1: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
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

  // 账户变更
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      userStore.setAddress(accounts[0])
      userStore.refreshBalance()
    }
  })

  // 网络变更
  window.ethereum.on('chainChanged', (chainId: string) => {
    userStore.setChainId(parseInt(chainId, 16))
    // 刷新页面以确保所有数据与新链一致
    window.location.reload()
  })
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
