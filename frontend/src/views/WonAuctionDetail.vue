<template>
  <div class="won-detail-page" v-loading="loading">
    <div class="container" v-if="auction">
      <!-- 顶部导航 -->
      <div class="breadcrumb">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回我的竞拍
        </el-button>
      </div>

      <el-row :gutter="40" class="main-content">
        <!-- 左侧：作品大图展示 -->
        <el-col :xs="24" :md="12">
          <div class="artwork-showcase">
            <div class="image-wrapper">
              <el-image
                :src="auction.artwork?.imageUrl"
                fit="contain"
                class="main-image"
                :preview-src-list="[auction.artwork?.imageUrl]"
              />
              <!-- 荣誉勋章 -->
              <div class="victory-badge">
                <el-icon class="trophy-icon"><Trophy /></el-icon>
                <div class="badge-text">
                  <span class="title">竞拍成功</span>
                  <span class="subtitle">您已获得该艺术品</span>
                </div>
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

        <!-- 右侧：成交详情与出价历史 -->
        <el-col :xs="24" :md="12">
          <div class="settlement-card">
            <div class="card-header">
              <h2 class="section-title">成交详情</h2>
              <el-tag type="success" effect="dark" class="status-tag">已结算</el-tag>
            </div>

            <div class="price-summary">
              <div class="summary-item main">
                <span class="label">最终成交价</span>
                <div class="value-group">
                  <span class="amount">{{ formatPrice(auction.highestBid) }}</span>
                  <span class="unit">ETH</span>
                </div>
              </div>
              <div class="summary-item">
                <span class="label">成交时间</span>
                <span class="value">{{ settleTime }}</span>
              </div>
            </div>

            <div class="ownership-info">
              <div class="owner-header">
                <el-avatar :size="40" class="user-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="owner-text">
                  <span class="label">当前所有者</span>
                  <span class="value">您 ({{ formatAddress(userStore.address) }})</span>
                </div>
              </div>
              <p class="congrats-text">
                恭喜您成功赢得这次竞拍！该艺术品的所有权已归属于您的地址。
              </p>
            </div>

            <div class="history-section">
              <div class="history-header">
                <h3 class="history-title">出价记录</h3>
                <span class="history-count">共 {{ bidHistory.length }} 条记录</span>
              </div>
              <div class="history-list">
                <transition-group name="list">
                  <div v-for="(bid, index) in displayedBids" :key="index" class="bid-row" :class="{ 'is-winner': index === 0 }">
                    <div class="bidder-info">
                      <span class="bidder-name">{{ bid.bidderName }}</span>
                      <span class="bid-time">{{ formatTime(bid.createdAt) }}</span>
                    </div>
                    <div class="bid-amount">
                      <span class="amount">{{ formatPrice(bid.amount) }}</span>
                      <span class="unit">ETH</span>
                      <el-tag v-if="index === 0" size="small" type="success" effect="plain" class="winner-tag">成交</el-tag>
                    </div>
                  </div>
                </transition-group>
              </div>
              
              <!-- 展开/收起按钮 -->
              <div v-if="bidHistory.length > 3" class="expand-action">
                <el-button 
                  link 
                  type="primary" 
                  @click="showAllBids = !showAllBids"
                  class="toggle-btn"
                >
                  {{ showAllBids ? '收起记录' : '展开全部出价' }}
                  <el-icon class="el-icon--right">
                    <component :is="showAllBids ? ArrowUp : ArrowDown" />
                  </el-icon>
                </el-button>
              </div>
            </div>

            <div class="actions">
              <el-button type="primary" size="large" class="full-btn" @click="$router.push('/profile')">
                在个人中心管理
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
import { ArrowLeft, Trophy, User, Clock, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAuctionById, getBidHistory } from '@/api/auction'
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
const settleTime = ref('')
const showAllBids = ref(false)

const displayedBids = computed(() => {
  if (showAllBids.value) return bidHistory.value
  return bidHistory.value.slice(0, 3)
})

const formatAddress = (addr: string) => {
  if (!addr) return 'Unknown'
  if (addr.toLowerCase() === userStore.address?.toLowerCase()) return '您'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const formatTime = (time: any) => {
  return dayjs(time).format('MM-DD HH:mm:ss')
}

const fetchDetail = async () => {
  const idParam = route.params.id
  if (!idParam) return
  const id = String(idParam).trim()

  loading.value = true
  
  // 模拟从 localStorage 获取成交信息
  const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  const savedBid = localMockBids[id]

  // 如果是 Mock 数据
  const isMock = id.startsWith('mock-') || isNaN(Number(id)) || (Number(id) >= 100 && Number(id) < 200)
  
  if (isMock) {
    const foundMock = mockAuctions.find(m => m.auctionId === id)
    const localCreated = JSON.parse(localStorage.getItem('MOCK_CREATED_AUCTIONS') || '[]')
    const foundLocal = localCreated.find((m: any) => m.auctionId === id)
    
    const finalFound = foundLocal || foundMock
    
    if (finalFound) {
      auction.value = JSON.parse(JSON.stringify(finalFound))
      if (savedBid) {
        auction.value!.highestBid = savedBid.currentPrice
        settleTime.value = savedBid.endTime
      } else {
        settleTime.value = dayjs(auction.value!.endTime).format('YYYY-MM-DD HH:mm:ss')
      }
    }
  } else {
    try {
      const res = await getAuctionById(Number(id))
      if (res.data) {
        auction.value = res.data
        settleTime.value = dayjs(auction.value!.endTime).format('YYYY-MM-DD HH:mm:ss')
      }
    } catch (e) {
      console.error('Failed to fetch auction detail:', e)
    }
  }

  // 如果还是没找到，给个保底显示，防止白屏
  if (!auction.value && savedBid) {
    auction.value = {
      auctionId: id,
      highestBid: savedBid.currentPrice,
      status: 4,
      endTime: savedBid.endTime,
      artwork: {
        name: savedBid.title || '已成交艺术品',
        imageUrl: savedBid.imageUrl || '',
        description: '您已成功拍得此作品。',
        creator: '0x...',
        tokenId: '...',
        isVerified: true
      }
    } as any
    settleTime.value = savedBid.endTime
  }

  // 模拟生成丰富的机器人出价记录
  if (auction.value) {
    const bids = []
    const basePrice = Number(auction.value.highestBid)
    const inc = 0.1
    
    // 第一条永远是“您”的成交出价
    bids.push({
      bidderName: '您',
      bidderAddress: userStore.address,
      amount: basePrice,
      createdAt: dayjs(settleTime.value).valueOf()
    })

    // 生成 5-8 条机器人出价记录
    const botCount = Math.floor(Math.random() * 4) + 5
    let currentBotPrice = basePrice
    for (let i = 1; i <= botCount; i++) {
      currentBotPrice -= inc * (Math.random() * 2 + 1)
      bids.push({
        bidderName: `Robot_${Math.floor(Math.random() * 900) + 100}`,
        bidderAddress: '0x' + Math.random().toString(16).slice(2, 42),
        amount: currentBotPrice.toFixed(2),
        createdAt: dayjs(settleTime.value).valueOf() - i * (Math.random() * 100000 + 50000)
      })
    }
    bidHistory.value = bids
  }

  loading.value = false
}

onMounted(fetchDetail)
</script>

<style lang="scss" scoped>
.won-detail-page {
  padding: 40px 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

.breadcrumb {
  margin-bottom: 24px;
}

.artwork-showcase {
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);

  .image-wrapper {
    position: relative;
    height: 450px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;

    .main-image {
      max-width: 100%;
      max-height: 100%;
    }

    .victory-badge {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      padding: 12px 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      border: 1px solid rgba(103, 194, 58, 0.3);

      .trophy-icon {
        font-size: 24px;
        color: #e6a23c;
      }

      .badge-text {
        display: flex;
        flex-direction: column;
        .title {
          font-weight: 800;
          color: #67c23a;
          font-size: 14px;
        }
        .subtitle {
          font-size: 11px;
          color: #909399;
        }
      }
    }
  }

  .artwork-info-card {
    padding: 30px;

    .artwork-name {
      font-size: 28px;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0 0 15px 0;
    }

    .artwork-desc {
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;

      .meta-item {
        .label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .value {
          font-weight: 700;
          color: #1e293b;
          &.address {
            font-family: monospace;
            color: #3b82f6;
          }
        }
      }
    }
  }
}

.settlement-card {
  background: #fff;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    .section-title {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
    }
  }

  .price-summary {
    background: #f8fafc;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 30px;

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      &:last-child { margin-bottom: 0; }

      &.main {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px dashed #cbd5e1;
        
        .label { font-size: 16px; font-weight: 600; color: #1e293b; }
        .amount { font-size: 32px; font-weight: 900; color: #3b82f6; }
        .unit { font-size: 16px; font-weight: 700; color: #3b82f6; margin-left: 4px; }
      }

      .label { color: #64748b; font-size: 14px; }
      .value { font-weight: 700; color: #1e293b; }
    }
  }

  .ownership-info {
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(103, 194, 58, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(103, 194, 58, 0.1);

    .owner-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .user-avatar { background: #3b82f6; }
      .owner-text {
        display: flex;
        flex-direction: column;
        .label { font-size: 11px; color: #94a3b8; }
        .value { font-weight: 700; color: #1e293b; font-size: 14px; }
      }
    }

    .congrats-text {
      margin: 0;
      font-size: 13px;
      color: #67c23a;
      line-height: 1.5;
      font-weight: 500;
    }
  }

  .history-section {
    margin-bottom: 30px;

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .history-title {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
      }

      .history-count {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .history-list {
      position: relative;
      
      .list-enter-active,
      .list-leave-active {
        transition: all 0.4s ease;
      }
      .list-enter-from,
      .list-leave-to {
        opacity: 0;
        transform: translateX(30px);
      }

      .bid-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;

        &.is-winner {
          .bidder-name { color: #67c23a; font-weight: 700; }
          .amount { color: #67c23a; }
        }

        .bidder-info {
          display: flex;
          flex-direction: column;
          .bidder-name { font-size: 14px; font-weight: 600; }
          .bid-time { font-size: 11px; color: #94a3b8; }
        }

        .bid-amount {
          display: flex;
          align-items: center;
          gap: 6px;
          .amount { font-weight: 700; }
          .unit { font-size: 12px; color: #94a3b8; }
          .winner-tag { transform: scale(0.8); }
        }
      }
    }

    .expand-action {
      text-align: center;
      margin-top: 15px;
      
      .toggle-btn {
        font-size: 13px;
        font-weight: 600;
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  .full-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    font-weight: 700;
  }
}
</style>
