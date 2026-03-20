<template>
  <div class="lost-detail-page" v-loading="loading">
    <div class="container" v-if="auction">
      <!-- 顶部导航 -->
      <div class="breadcrumb">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回我的竞拍
        </el-button>
      </div>

      <el-row :gutter="40" class="main-content">
        <!-- 左侧：作品信息展示 -->
        <el-col :xs="24" :md="12">
          <div class="artwork-showcase">
            <div class="image-wrapper">
              <el-image
                :src="auction.artwork?.imageUrl"
                fit="contain"
                class="main-image"
                :preview-src-list="[auction.artwork?.imageUrl]"
              />
              <div class="lost-overlay">
                <el-icon class="close-icon"><CircleClose /></el-icon>
                <span>未拍得</span>
              </div>
            </div>
            
            <div class="artwork-info-card">
              <h1 class="artwork-name">{{ auction.artwork?.name }}</h1>
              <p class="artwork-desc">{{ auction.artwork?.description }}</p>
              
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="label">Token ID</span>
                  <span class="value">#{{ auction.artwork?.tokenId }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">创作者</span>
                  <span class="value address">{{ formatAddress(auction.artwork?.creator) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：竞拍结果对比与历史 -->
        <el-col :xs="24" :md="12">
          <div class="result-card">
            <div class="card-header">
              <h2 class="section-title">竞拍总结</h2>
              <el-tag type="info" effect="plain" class="status-tag">已结束</el-tag>
            </div>

            <!-- 关键对比：最高出价 vs 我的出价 -->
            <div class="comparison-grid">
              <div class="comp-item winner-box">
                <div class="crown-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path fill="#FFD700" d="M5,16L3,5L8.5,10L12,4L15.5,10L21,5L19,16H5M19,19A1,1 0 0,1 18,20H6A1,1 0 0,1 5,19V18H19V19Z" />
                  </svg>
                </div>
                <span class="label">最高出价者</span>
                <div class="bidder-tag">
                  <el-avatar :size="24" class="mini-avatar"><User /></el-avatar>
                  <span>{{ winnerInfo.name }}</span>
                </div>
                <div class="price">
                  <span class="amount">{{ formatPrice(auction.highestBid) }}</span>
                  <span class="unit">ETH</span>
                </div>
              </div>

              <div class="comp-item me-box">
                <span class="label">我的最高出价</span>
                <div class="bidder-tag">
                  <el-avatar :size="24" class="mini-avatar me"><User /></el-avatar>
                  <span>您</span>
                </div>
                <div class="price">
                  <span class="amount">{{ formatPrice(myLastBid) }}</span>
                  <span class="unit">ETH</span>
                </div>
                <p class="diff-hint">相差 {{ (Number(auction.highestBid) - Number(myLastBid)).toFixed(2) }} ETH</p>
              </div>
            </div>

            <div class="history-section">
              <div class="history-header">
                <h3 class="history-title">完整出价历史</h3>
                <span class="history-count">共 {{ bidHistory.length }} 条记录</span>
              </div>
              <div class="history-list">
                <transition-group name="list">
                  <div v-for="(bid, index) in displayedBids" :key="index" class="bid-row" :class="{ 'is-winner': index === 0, 'is-me': isMe(bid.bidderAddress) }">
                    <div class="bidder-info">
                      <div class="name-row">
                        <span class="bidder-name">{{ isMe(bid.bidderAddress) ? '您' : bid.bidderName }}</span>
                        <el-tag v-if="index === 0" size="small" type="warning" class="winner-label">
                          <el-icon><StarFilled /></el-icon> 获胜者
                        </el-tag>
                      </div>
                      <span class="bid-time">{{ formatTime(bid.createdAt) }}</span>
                    </div>
                    <div class="bid-amount">
                      <span class="amount">{{ formatPrice(bid.amount) }}</span>
                      <span class="unit">ETH</span>
                    </div>
                  </div>
                </transition-group>
              </div>
              
              <div v-if="bidHistory.length > 4" class="expand-action">
                <el-button link type="primary" @click="showAllBids = !showAllBids">
                  {{ showAllBids ? '收起记录' : '查看完整历史' }}
                  <el-icon class="el-icon--right">
                    <component :is="showAllBids ? ArrowUp : ArrowDown" />
                  </el-icon>
                </el-button>
              </div>
            </div>

            <div class="actions">
              <el-button type="primary" class="full-btn" @click="$router.push('/auctions')">
                浏览其他拍卖
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, User, ArrowDown, ArrowUp, CircleClose, StarFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAuctionById } from '@/api/auction'
import { mockAuctions } from '@/utils/mockData'
import { formatPrice } from '@/utils/format'
import type { Auction } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const auction = ref<Auction | null>(null)
const bidHistory = ref<any[]>([])
const myLastBid = ref('0')
const winnerInfo = ref({ name: 'Robot_Winner', address: '' })
const showAllBids = ref(false)

const displayedBids = computed(() => {
  if (showAllBids.value) return bidHistory.value
  return bidHistory.value.slice(0, 4)
})

const isMe = (addr: string) => addr?.toLowerCase() === userStore.address?.toLowerCase()

const formatAddress = (addr: string) => {
  if (!addr) return 'Unknown'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const formatTime = (time: any) => dayjs(time).format('MM-DD HH:mm:ss')

const fetchDetail = async () => {
  const idParam = route.params.id
  if (!idParam) return
  const id = String(idParam).trim()

  loading.value = true
  
  // 模拟从 localStorage 获取成交信息
  const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  const savedBid = localMockBids[id]

  const isMock = id.startsWith('mock-') || isNaN(Number(id)) || (Number(id) >= 100 && Number(id) < 200)
  
  if (isMock) {
    const foundMock = mockAuctions.find(m => m.auctionId === id)
    const localCreated = JSON.parse(localStorage.getItem('MOCK_CREATED_AUCTIONS') || '[]')
    const foundLocal = localCreated.find((m: any) => m.auctionId === id)
    const finalFound = foundLocal || foundMock
    
    if (finalFound) {
      auction.value = JSON.parse(JSON.stringify(finalFound))
    }
  } else {
    try {
      const res = await getAuctionById(Number(id))
      if (res.data) {
        auction.value = res.data
      }
    } catch (e) {
      console.error('Failed to fetch auction detail:', e)
    }
  }

  // 保底逻辑：如果找不到作品，从本地竞拍记录中重建
  if (!auction.value && savedBid) {
    auction.value = {
      auctionId: id,
      highestBid: savedBid.currentPrice,
      status: 4,
      endTime: savedBid.endTime,
      artwork: {
        name: savedBid.title || '竞拍作品',
        imageUrl: savedBid.imageUrl || '',
        description: '拍卖已结束。',
        creator: '0x...',
        tokenId: '...',
        isVerified: true
      }
    } as any
  }

  // 模拟竞拍失败的出价记录对比
  if (auction.value) {
    const bids = []
    // 如果本地有记录，使用本地记录的价格，否则用作品的最高价
    const winPrice = savedBid ? Number(savedBid.currentPrice) : (Number(auction.value.highestBid) || 2.5)
    
    // 获胜者信息（如果是 lost 状态，获胜者是一个机器人）
    winnerInfo.value = { 
      name: `Robot_${Math.floor(Math.random()*900)+100}`,
      address: '0x' + Math.random().toString(16).slice(2, 42)
    }

    // 第一条：获胜的机器人
    bids.push({
      bidderName: winnerInfo.value.name,
      bidderAddress: winnerInfo.value.address,
      amount: winPrice.toFixed(2),
      createdAt: Date.now() - 3600000
    })

    // 我的最后一次出价（失败者出价低于获胜者）
    myLastBid.value = savedBid ? savedBid.myPrice : (winPrice - 0.2).toFixed(2)
    bids.push({
      bidderName: '您',
      bidderAddress: userStore.address,
      amount: myLastBid.value,
      createdAt: Date.now() - 7200000
    })

    // 更多竞争记录
    for (let i = 2; i <= 6; i++) {
      bids.push({
        bidderName: `Robot_${Math.floor(Math.random()*900)+100}`,
        bidderAddress: '0x' + Math.random().toString(16).slice(2, 42),
        amount: (winPrice - 0.2 * i).toFixed(2),
        createdAt: Date.now() - (i + 1) * 3600000
      })
    }
    bidHistory.value = bids
  }

  loading.value = false
}

onMounted(fetchDetail)
</script>

<style lang="scss" scoped>
.lost-detail-page {
  padding: 40px 0;
  min-height: 100vh;
  background: #f1f5f9;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

.artwork-showcase {
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);

  .image-wrapper {
    position: relative;
    height: 400px;
    background: #1a1a2e;
    display: flex;
    align-items: center;
    justify-content: center;

    .lost-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      backdrop-filter: blur(4px);
      
      .close-icon { font-size: 60px; margin-bottom: 10px; color: #f56c6c; }
      span { font-size: 24px; font-weight: 800; letter-spacing: 4px; }
    }
  }

  .artwork-info-card {
    padding: 30px;
    .artwork-name { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
    .artwork-desc { color: #64748b; font-size: 14px; line-height: 1.6; }
  }
}

.result-card {
  background: #fff;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;

    .comp-item {
      padding: 24px;
      border-radius: 20px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      &.winner-box {
        background: linear-gradient(135deg, #fff9db 0%, #fff3bf 100%);
        border: 2px solid #fab005;
        .crown-icon { position: absolute; top: -15px; }
        .amount { color: #e67e22; }
      }

      &.me-box {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        .amount { color: #3b82f6; }
      }

      .label { font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 12px; }
      .bidder-tag {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 700;
        .mini-avatar.me { background: #3b82f6; }
      }
      .price {
        .amount { font-size: 28px; font-weight: 900; }
        .unit { font-size: 14px; font-weight: 700; margin-left: 4px; }
      }
      .diff-hint { margin-top: 8px; font-size: 11px; color: #ef4444; font-weight: 600; }
    }
  }

  .history-section {
    .history-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 15px;
      .history-title { font-size: 16px; font-weight: 700; }
      .history-count { font-size: 12px; color: #94a3b8; }
    }

    .bid-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #f1f5f9;
      
      &.is-winner { background: rgba(250, 176, 5, 0.05); }
      &.is-me { border-left: 4px solid #3b82f6; padding-left: 12px; }

      .bidder-info {
        .name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .bidder-name { font-size: 14px; font-weight: 600; }
        .bid-time { font-size: 11px; color: #94a3b8; }
      }
      .bid-amount {
        .amount { font-weight: 700; }
        .unit { font-size: 12px; color: #94a3b8; margin-left: 4px; }
      }
    }
  }

  .full-btn { width: 100%; height: 50px; border-radius: 12px; font-weight: 700; margin-top: 30px; }
}

.meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9;
  .label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
  .value { font-weight: 700; font-family: monospace; }
}
</style>
