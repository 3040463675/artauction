import { ethers } from 'ethers'
import { getSigner, getProvider } from './wallet'
import ArtNFTABI from './abis/ArtNFT.json'
import AuctionABI from './abis/Auction.json'

// 合约地址配置
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || ''
const AUCTION_CONTRACT_ADDRESS = import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS || ''

// 获取NFT合约实例 (只读)
export const getNFTContractRead = async () => {
  const provider = getProvider()
  return new ethers.Contract(NFT_CONTRACT_ADDRESS, ArtNFTABI, provider)
}

// 获取NFT合约实例 (可写)
export const getNFTContractWrite = async () => {
  const signer = await getSigner()
  return new ethers.Contract(NFT_CONTRACT_ADDRESS, ArtNFTABI, signer)
}

// 获取拍卖合约实例 (只读)
export const getAuctionContractRead = async () => {
  const provider = getProvider()
  return new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AuctionABI, provider)
}

// 获取拍卖合约实例 (可写)
export const getAuctionContractWrite = async () => {
  const signer = await getSigner()
  return new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AuctionABI, signer)
}

// =============== NFT 相关操作 ===============

// 铸造NFT
export const mintArt = async (
  name: string,
  description: string,
  imageUrl: string,
  ipfsHash: string
): Promise<number> => {
  const contract = await getNFTContractWrite()
  const signer = await getSigner()
  const address = await signer.getAddress()

  const tx = await contract.mintArt(address, name, description, imageUrl, ipfsHash)
  const receipt = await tx.wait()

  // 解析事件获取tokenId
  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === 'ArtMinted'
    } catch {
      return false
    }
  })

  if (event) {
    const parsed = contract.interface.parseLog(event)
    return Number(parsed?.args.tokenId)
  }

  throw new Error('Failed to get tokenId from event')
}

// 获取艺术品信息
export const getArtInfo = async (tokenId: number) => {
  const contract = await getNFTContractRead()
  return contract.getArtInfo(tokenId)
}

// 获取用户拥有的艺术品列表
export const getArtsByOwner = async (owner: string) => {
  const contract = await getNFTContractRead()
  return contract.getArtsByOwner(owner)
}

// =============== 拍卖相关操作 ===============

// 创建拍卖
export const createAuction = async (
  tokenId: number,
  startingPrice: string, // ETH
  reservePrice: string,  // ETH
  minIncrement: string,  // ETH
  duration: number       // 秒
): Promise<number> => {
  const contract = await getAuctionContractWrite()

  const startingPriceWei = ethers.parseEther(startingPrice)
  const reservePriceWei = ethers.parseEther(reservePrice)
  const minIncrementWei = ethers.parseEther(minIncrement)

  // 先授权NFT
  const nftContract = await getNFTContractWrite()
  const approveTx = await nftContract.approve(AUCTION_CONTRACT_ADDRESS, tokenId)
  await approveTx.wait()

  // 创建拍卖
  const tx = await contract.createAuction(
    tokenId,
    startingPriceWei,
    reservePriceWei,
    minIncrementWei,
    duration
  )
  const receipt = await tx.wait()

  // 解析事件获取auctionId
  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === 'AuctionCreated'
    } catch {
      return false
    }
  })

  if (event) {
    const parsed = contract.interface.parseLog(event)
    return Number(parsed?.args.auctionId)
  }

  throw new Error('Failed to get auctionId from event')
}

// 出价
export const placeBid = async (auctionId: number, amount: string) => {
  const contract = await getAuctionContractWrite()
  const value = ethers.parseEther(amount)

  const tx = await contract.placeBid(auctionId, { value })
  return tx.wait()
}

// 结束拍卖
export const endAuction = async (auctionId: number) => {
  const contract = await getAuctionContractWrite()
  const tx = await contract.endAuction(auctionId)
  return tx.wait()
}

// 取消拍卖
export const cancelAuction = async (auctionId: number) => {
  const contract = await getAuctionContractWrite()
  const tx = await contract.cancelAuction(auctionId)
  return tx.wait()
}

// 获取拍卖信息
export const getAuctionInfo = async (auctionId: number) => {
  const contract = await getAuctionContractRead()
  const info = await contract.getAuctionInfo(auctionId)

  return {
    auctionId: Number(info.auctionId),
    tokenId: Number(info.tokenId),
    seller: info.seller,
    startingPrice: ethers.formatEther(info.startingPrice),
    reservePrice: ethers.formatEther(info.reservePrice),
    minIncrement: ethers.formatEther(info.minIncrement),
    startTime: Number(info.startTime) * 1000,
    endTime: Number(info.endTime) * 1000,
    highestBid: ethers.formatEther(info.highestBid),
    highestBidder: info.highestBidder,
    status: info.status,
    createdAt: Number(info.createdAt) * 1000
  }
}

// 获取出价历史
export const getBidHistoryOnChain = async (auctionId: number) => {
  const contract = await getAuctionContractRead()
  const history = await contract.getBidHistory(auctionId)

  return history.map((bid: any) => ({
    bidder: bid.bidder,
    amount: ethers.formatEther(bid.amount),
    timestamp: Number(bid.timestamp) * 1000
  }))
}

// 获取所有活跃拍卖
export const getActiveAuctions = async () => {
  const contract = await getAuctionContractRead()
  const ids = await contract.getActiveAuctions()
  return ids.map((id: any) => Number(id))
}
