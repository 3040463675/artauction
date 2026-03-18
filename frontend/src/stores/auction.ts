import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAuctions, getAuctionById, getBidHistory } from '@/api/auction'
import type { Auction, Bid } from '@/types'

export const useAuctionStore = defineStore('auction', () => {
  const auctions = ref<Auction[]>([])
  const currentAuction = ref<Auction | null>(null)
  const bidHistory = ref<Bid[]>([])
  const loading = ref(false)
  const total = ref(0)

  // 获取拍卖列表
  const fetchAuctions = async (params?: any) => {
    loading.value = true
    try {
      const res = await getAuctions(params)
      auctions.value = res.data.list
      total.value = res.data.total
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取拍卖详情
  const fetchAuctionDetail = async (id: number) => {
    loading.value = true
    try {
      const res = await getAuctionById(id)
      currentAuction.value = res.data
    } catch (error) {
      console.error('Failed to fetch auction detail:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取出价历史
  const fetchBidHistory = async (auctionId: number) => {
    try {
      const res = await getBidHistory(auctionId)
      bidHistory.value = res.data
    } catch (error) {
      console.error('Failed to fetch bid history:', error)
    }
  }

  return {
    auctions,
    currentAuction,
    bidHistory,
    loading,
    total,
    fetchAuctions,
    fetchAuctionDetail,
    fetchBidHistory
  }
})
