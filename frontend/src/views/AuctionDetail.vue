<template>
  <div class="auction-detail-page" v-loading="loading">
    <div class="container" v-if="auction">
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/explore' }">探索</el-breadcrumb-item>
          <el-breadcrumb-item>作品详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-row :gutter="40" class="main-content">
        <!-- 左侧图片展示 -->
        <el-col :xs="24" :md="12">
          <div class="image-card">
            <div class="image-wrapper">
              <el-image
                :src="auction.artwork?.imageUrl"
                fit="cover"
                class="main-image"
                :preview-src-list="[auction.artwork?.imageUrl]"
              />
              <div class="verified-badge" v-if="auction.artwork?.isVerified">
                <el-icon><CircleCheckFilled /></el-icon>
                <span>已认证</span>
              </div>
            </div>
            
            <div class="artwork-meta-grid">
              <div class="meta-item">
                <span class="label">Token ID</span>
                <span class="value">#{{ auction.artwork?.tokenId }}</span>
              </div>
              <div class="meta-item">
                <span class="label">存储</span>
                <el-link 
                  v-if="auction.artwork?.ipfsHash" 
                  :href="'https://ipfs.io/ipfs/' + auction.artwork.ipfsHash" 
                  target="_blank" 
                  type="primary"
                  class="value"
                >
                  IPFS <el-icon><Link /></el-icon>
                </el-link>
              </div>
              <div class="meta-item">
                <span class="label">标准</span>
                <span class="value">ERC-721</span>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧竞拍信息 -->
        <el-col :xs="24" :md="12">
          <div class="auction-card">
            <div class="header-info">
              <div class="title-row">
                <h1 class="title">{{ auction.artwork?.name }}</h1>
                <el-tag v-if="battleState === 'success'" type="success" effect="dark" class="success-badge">
                  竞拍成功
                </el-tag>
                <el-tag v-else-if="auction.highestBidder === userStore.address" type="success" class="highest-bidder-tag">
                  最高出价
                </el-tag>
              </div>
              <div class="status-tags">
                <el-tag :type="getStatusType(auction.status)" effect="dark">
                  {{ getStatusText(auction.status) }}
                </el-tag>
                <el-tag type="info" v-if="auction.txHash">
                  <el-link :href="getExplorerUrl(auction.txHash)" target="_blank" :underline="false">
                    链上存证 <el-icon><TopRight /></el-icon>
                  </el-link>
                </el-tag>
              </div>
            </div>

            <div class="creator-section">
              <div class="profile-item">
                <el-avatar :size="48" class="gradient-avatar">
                  <el-icon :size="24"><User /></el-icon>
                </el-avatar>
                <div class="profile-info">
                  <span class="label">创作者</span>
                  <span class="address">{{ formatAddress(auction.artwork?.creator) }}</span>
                </div>
              </div>
              <div class="profile-item">
                <el-avatar :size="48" class="owner-avatar">
                  <el-icon :size="24"><Wallet /></el-icon>
                </el-avatar>
                <div class="profile-info">
                  <span class="label">持有者</span>
                  <span class="address">{{ formatAddress(auction.sellerAddress) }}</span>
                </div>
              </div>
            </div>

            <div class="price-display-card">
              <div class="bid-info">
                <span class="label">{{ auction.status === 1 ? '当前出价' : '最终成交价' }}</span>
                <div class="price-value">
                  <span class="amount">{{ auction.highestBid || auction.startingPrice }}</span>
                  <span class="unit">ETH</span>
                </div>
                <div class="reserve-status" v-if="auction.reservePrice > 0">
                  <el-tooltip :content="'保留价: ' + auction.reservePrice + ' ETH'" placement="top">
                    <span class="reserve-label">
                      <el-icon><Lock /></el-icon>
                      {{ Number(auction.highestBid) >= Number(auction.reservePrice) ? '已达保留价' : '未达保留价' }}
                    </span>
                  </el-tooltip>
                </div>
              </div>

              <div class="timer-info">
                <span class="label">{{ battleState === 'success' || isCancelled ? '成交时间' : '拍卖截止' }}</span>
                <div v-if="battleState === 'success' || isCancelled" class="settle-time-display">
                  <el-icon><Clock /></el-icon>
                  <span>{{ settleTime }}</span>
                </div>
                <CountdownTimer v-else :endTime="auction.endTime" @end="handleAuctionEnd" />
              </div>
            </div>

            <div class="auction-specs">
              <div class="spec-item">
                <span class="label">起拍价</span>
                <span class="value">{{ auction.startingPrice }} ETH</span>
              </div>
              <div class="spec-item">
                <span class="label">最小加价</span>
                <span class="value">{{ auction.minIncrement }} ETH</span>
              </div>
            </div>

            <div class="action-section" v-if="auction.status === 1">
              <div class="bid-controls">
                <div class="bid-input-group">
                  <div class="input-wrapper">
                    <el-input-number
                      v-model="bidAmount"
                      :min="minBid"
                      :step="Number(auction.minIncrement)"
                      :precision="4"
                      size="large"
                      controls-position="right"
                      :disabled="isCancelled"
                    />
                    <span class="input-unit">ETH</span>
                  </div>
                  <p class="min-bid-hint">最低有效出价: <strong>{{ minBid }} ETH</strong></p>
                </div>
                
                <div class="action-buttons">
                  <el-button
                    :type="battleState === 'success' ? 'info' : 'primary'"
                    size="large"
                    class="bid-btn premium-btn"
                    :loading="bidding"
                    :disabled="isCancelled || battleState === 'success'"
                    @click="handleBid"
                  >
                    {{ battleState === 'success' ? '禁止竞拍' : '立即竞拍' }}
                  </el-button>
                  <el-button
                    type="danger"
                    size="large"
                    class="cancel-btn"
                    plain
                    :disabled="isCancelled || battleState === 'success'"
                    @click="handleCancelBid"
                  >
                    取消竞拍
                  </el-button>
                </div>
              </div>
            </div>

            <div class="seller-actions" v-if="canEndAuction">
              <el-button
                type="danger"
                size="large"
                class="end-btn"
                plain
                :loading="ending"
                @click="handleEndAuction"
              >
                结束并结算拍卖
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="40" class="details-tabs">
        <el-col :span="24">
          <el-tabs v-model="activeTab" class="premium-tabs">
            <el-tab-pane label="作品描述" name="desc">
              <div class="content-panel">
                <p class="description-text">{{ auction.artwork?.description || '暂无描述' }}</p>
              </div>
            </el-tab-pane>
            <el-tab-pane label="出价记录" name="history">
              <div class="content-panel">
                <el-table :data="bidHistory" style="width: 100%" class="history-table">
                  <el-table-column label="出价者" min-width="180">
                    <template #default="{ row, $index }">
                      <div class="bidder-cell">
                        <el-avatar :size="24" icon="User" />
                        <span class="addr">{{ formatAddress(row.bidderAddress) }}</span>
                        <!-- 只有当取消且是第一名时才显示皇冠 -->
                        <span v-if="(isCancelled || battleState === 'success') && $index === 0" class="crown-icon" title="当前赢家">👑</span>
                        <el-tag v-else-if="row.bidderAddress === auction.highestBidder" size="small" type="success" effect="plain" class="winner-tag">最高</el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" width="150">
                    <template #default="{ row }">
                      <span class="bid-amount">{{ row.amount }} ETH</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="时间" width="180">
                    <template #default="{ row }">
                      <span class="time-text">{{ formatTime(row.createdAt) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="交易" width="100" align="right">
                    <template #default="{ row }">
                      <el-link v-if="row.txHash" :href="getExplorerUrl(row.txHash)" target="_blank">
                        <el-icon><TopRight /></el-icon>
                      </el-link>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-if="bidHistory.length === 0" description="目前尚无出价" />
              </div>
            </el-tab-pane>
            <el-tab-pane label="艺术品属性" name="props">
              <div class="content-panel props-grid">
                <div class="prop-card">
                  <span class="p-label">认证状态</span>
                  <span class="p-value">{{ auction.artwork?.isVerified ? '官方认证' : '普通作品' }}</span>
                </div>
                <div class="prop-card">
                  <span class="p-label">创作日期</span>
                  <span class="p-value">{{ formatTime(auction.artwork?.createdAt) }}</span>
                </div>
                <div class="prop-card">
                  <span class="p-label">版权比例</span>
                  <span class="p-value">10%</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, Wallet, Link, Lock, 
  CircleCheckFilled, TopRight, Clock
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { placeBid, endAuction } from '@/utils/contracts'
import { getAuctionById, getBidHistory } from '@/api/auction'
import CountdownTimer from '@/components/CountdownTimer.vue'
import { ethers } from 'ethers'
import { mockAuctions } from '@/utils/mockData'

// ==========================================
// 🤖 机器人配置 (Ganache 测试专用)
// ==========================================
const BOT_PRIVATE_KEYS = [
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account 1
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', // Account 2
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a', // Account 3
  '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba', // Account 4
  '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d6ffb2bc538910'  // Account 5
]
const GANACHE_RPC = "http://127.0.0.1:7545"

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const bidding = ref(false)
const ending = ref(false)
const isCancelled = ref(false)
const settleTime = ref('') // 定格时间
const battleState = ref<'waiting' | 'active' | 'success' | 'cancelled'>('waiting')
const isFirstLoad = ref(true)

const auction = ref<any>(null)
const bidHistory = ref<any[]>([])
const bidAmount = ref(0)
const activeTab = ref('desc')

// 🤖 机器人执行真实出价 (用于开局抢跑或反击)
const executeBotBid = async (auctionId: string | number, currentHighest: number) => {
  const botIndex = Math.floor(Math.random() * BOT_PRIVATE_KEYS.length)
  const botPrivateKey = BOT_PRIVATE_KEYS[botIndex]
  
  try {
    const provider = new ethers.JsonRpcProvider(GANACHE_RPC)
    const wallet = new ethers.Wallet(botPrivateKey, provider)
    
    const increment = Number(auction.value.minIncrement) || 0.1
    const bidValue = (currentHighest + increment + (Math.random() * 0.05)).toFixed(4)
    
    // 如果是真实合约，执行合约调用；如果是 mock，执行转账以扣除余额
    if (auctionId.toString().startsWith('mock-')) {
      const previousBidder = auction.value.highestBidder
      const previousAmount = auction.value.highestBid

      const randomAddr = ethers.Wallet.createRandom().address
      const tx = await wallet.sendTransaction({
        to: randomAddr,
        value: ethers.parseEther(bidValue)
      })
      await tx.wait()

      // 💡 模拟退款逻辑 (仅针对 Mock 数据)
      // 如果前一个出价者是当前登录用户，把钱“退回”给用户
      if (previousBidder?.toLowerCase() === userStore.address.toLowerCase()) {
        console.log(`💰 [Mock Refund] 退还用户 ${previousAmount} ETH`)
        const currentBal = parseFloat(userStore.balance)
        userStore.setBalance((currentBal + parseFloat(previousAmount)).toFixed(4))
        ElMessage.info(`由于被反超，您的出价 ${previousAmount} ETH 已退回到钱包`)
      }

      // 更新本地 UI 状态 (Mock)
      const newBid = {
        bidderAddress: wallet.address,
        amount: bidValue,
        createdAt: Date.now(),
        txHash: tx.hash
      }
      // 使用新数组引用确保 Vue 响应式触发
      bidHistory.value = [newBid, ...bidHistory.value]
      auction.value.highestBid = bidValue
      auction.value.highestBidder = wallet.address
      
      // 同步更新输入框的最小出价
      bidAmount.value = Number(bidValue) + (Number(auction.value.minIncrement) || 0.1)
      
      return { success: true, bidValue, bidder: wallet.address }
    } else {
      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS,
        ["function placeBid(uint256 auctionId) external payable"],
        wallet
      )
      const tx = await auctionContract.placeBid(Number(auctionId), { 
        value: ethers.parseEther(bidValue) 
      })
      await tx.wait()
      return { success: true, bidValue, bidder: wallet.address }
    }
  } catch (e) {
    console.error("机器人出价失败:", e)
    return { success: false }
  }
}

// 🎮 机器人“反击”逻辑：20% 概率在 3 秒内加价
const triggerSimulationBotRevenge = async () => {
  if (isCancelled.value || battleState.value === 'success') return

  console.log("🤖 机器人正在评估是否在 3 秒内反击...")
  
  // 3秒总计时开始
  const BATTLE_DURATION = 3000
  let isOutbid = false

  // 20% 概率反击
  if (Math.random() < 0.2) {
    // 在 0.5 到 2.5 秒之间随机一个反击点
    const revengeDelay = Math.floor(Math.random() * 2000) + 500
    
    setTimeout(async () => {
      if (isCancelled.value || battleState.value === 'success') return
      
      isOutbid = true
      const currentPrice = Number(auction.value.highestBid)
      console.log("🚀 机器人抢在 3 秒内发起反击！")
      const result = await executeBotBid(auction.value.auctionId, currentPrice)
      
      if (result.success) {
        ElMessage({
          message: `哎呀！有人超过了您的出价！出价人 ${formatAddress(result.bidder)} 目前最高价为 ${result.bidValue} ETH`,
          type: 'warning',
          duration: 5000,
          showClose: true
        })
      }
    }, revengeDelay)
  }

  // 3 秒后检查结果
  setTimeout(() => {
    if (!isOutbid && !isCancelled.value && battleState.value !== 'success') {
      // 检查当前最高出价者是否还是用户
      if (auction.value.highestBidder?.toLowerCase() === userStore.address.toLowerCase()) {
        console.log("🎉 3 秒内无人加价，用户获胜！")
        battleState.value = 'success'
        isCancelled.value = true // 锁定 UI
        const winTime = dayjs().format('YYYY/MM/DD HH:mm:ss')
        settleTime.value = winTime
        
        // 持久化存储到本地，确保刷新后依然是获胜状态
        const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
        mockBids[auction.value.auctionId] = {
          id: auction.value.auctionId,
          title: auction.value.artwork?.name,
          imageUrl: auction.value.artwork?.imageUrl,
          currentPrice: auction.value.highestBid,
          myPrice: auction.value.highestBid,
          endTime: winTime,
          bidStatus: 'won'
        }
        localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))

        // 弹出竞拍结果弹框
        ElMessageBox.alert(
          `恭喜！您以 ${auction.value.highestBid} ETH 的价格成功赢得了作品《${auction.value.artwork?.name}》！`,
          '竞拍结果',
          {
            confirmButtonText: '太棒了',
            type: 'success',
            callback: () => {
              // 可以在这里做一些额外的跳转或状态更新
            }
          }
        )
      }
    }
  }, BATTLE_DURATION)
}

// 🎮 开局初始化：3秒静默抢跑
const simulateInitialBots = async () => {
  if (!isFirstLoad.value) return
  isFirstLoad.value = false

  // 3秒静默倒计时
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 随机 0-5 个机器人抢跑
  const botCount = Math.floor(Math.random() * 6)
  if (botCount > 0 && auction.value && !isCancelled.value) {
    let currentPrice = Number(auction.value.highestBid) || Number(auction.value.startingPrice)
    
    for (let i = 0; i < botCount; i++) {
      await executeBotBid(auction.value.auctionId, currentPrice)
      const increment = Number(auction.value.minIncrement) || 0.1
      currentPrice += increment
    }
    // 如果是真实合约，刷新列表；如果是 mock，已经在 executeBotBid 更新了
    if (!auction.value.auctionId.toString().startsWith('mock-')) {
      await fetchAuctionDetail()
    }
  }
  battleState.value = 'active'
}

const minBid = computed(() => {
  if (!auction.value) return 0
  const highest = Number(auction.value.highestBid) || 0
  const starting = Number(auction.value.startingPrice) || 0
  const increment = Number(auction.value.minIncrement) || 0.01
  
  return highest > 0 ? Number((highest + increment).toFixed(4)) : starting
})

const canEndAuction = computed(() => {
  if (!auction.value || !userStore.isConnected) return false
  const now = Date.now()
  const endTime = new Date(auction.value.endTime).getTime()
  return (
    auction.value.status === 1 &&
    now >= endTime &&
    userStore.address.toLowerCase() === auction.value.sellerAddress.toLowerCase()
  )
})

const formatAddress = (address: string) => {
  if (!address) return 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatTime = (time: string | number | Date) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getExplorerUrl = (txHash: string) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`
}

const getStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger',
    4: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '未开始',
    1: '正在拍卖',
    2: '已结束',
    3: '已取消',
    4: '交易完成'
  }
  return texts[status] || '未知'
}

const fetchAuctionDetail = async () => {
  // 每次进入先重置，避免旧数据闪现
  auction.value = null
  bidHistory.value = []
  
  const idParam = route.params.id
  if (!idParam) {
    console.error('No ID param found in route')
    return
  }
  
  const id = String(idParam).trim()
  
  // 💡 修复逻辑：处理模拟数据 ID (如 mock-a1)
  const isMock = id.startsWith('mock-') || isNaN(Number(id))

  if (isMock) {
    // 从共享模拟数据中查找
    const foundMock = mockAuctions.find(m => m.auctionId === id)
    
    // 检查本地存储，看是否已经获胜
    const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
    const savedBid = localMockBids[id]

    if (foundMock) {
      auction.value = JSON.parse(JSON.stringify(foundMock)) // 深拷贝防止修改原数据
      // 如果本地存过且状态是 won，直接恢复状态
      if (savedBid && savedBid.bidStatus === 'won') {
        auction.value.highestBid = savedBid.currentPrice
        auction.value.highestBidder = userStore.address
        battleState.value = 'success'
        isCancelled.value = true
        settleTime.value = savedBid.endTime // 使用保存的时间
      }
    } else {
      // 如果没找到（可能是手动输入的 ID），显示默认 mock
      auction.value = {
        auctionId: id,
        artwork: {
          name: '模拟艺术品',
          imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8',
          description: '这是一个通用的模拟作品详情。',
          creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
        },
        startingPrice: '1.0',
        highestBid: '1.5',
        minIncrement: '0.1',
        status: 1,
        endTime: Date.now() + 86400000
      }
    }
    
    // 构造出价历史
    if (savedBid && savedBid.bidStatus === 'won') {
      bidHistory.value = [
        { bidderAddress: userStore.address, amount: savedBid.myPrice, createdAt: Date.now() - 60000 },
        { bidderAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', amount: foundMock?.startingPrice || '1.0', createdAt: Date.now() - 3600000 }
      ]
    } else {
      bidHistory.value = [
        { bidderAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', amount: auction.value.highestBid, createdAt: Date.now() - 3600000 }
      ]
    }

    bidAmount.value = Number(auction.value.highestBid) + Number(auction.value.minIncrement)
    loading.value = false
    
    // 初始化时执行开局机器人抢跑 (仅针对未获胜的模拟数据执行)
    if (battleState.value === 'waiting') {
      simulateInitialBots()
    }
    return
  }

  loading.value = true
  try {
    const res = await getAuctionById(Number(id))
    auction.value = res.data
    
    const historyRes = await getBidHistory(Number(id))
    bidHistory.value = historyRes.data || []
    
    bidAmount.value = minBid.value

    // 初始化时执行开局机器人抢跑
    if (battleState.value === 'waiting') {
      simulateInitialBots()
    }
  } catch (error) {
    console.error('Failed to fetch auction:', error)
    ElMessage.error('获取拍卖详情失败')
  } finally {
    loading.value = false
  }
}

const handleCancelBid = () => {
  ElMessageBox.confirm('确认放弃本次竞拍？放弃后将无法再出价。', '放弃确认', {
    confirmButtonText: '确认放弃',
    cancelButtonText: '暂不放弃',
    type: 'warning'
  }).then(() => {
    isCancelled.value = true
    // 时间定格在当前时间
    settleTime.value = dayjs().format('YYYY/MM/DD HH:mm:ss')
    
    const highestBidder = bidHistory.value[0]?.bidderAddress
    if (highestBidder?.toLowerCase() === userStore.address.toLowerCase()) {
      battleState.value = 'success'
      ElMessage.success('恭喜！您成功赢得了本次竞拍！')
    } else {
      battleState.value = 'cancelled'
      ElMessage.info(`您已放弃竞拍。最终赢家是 ${formatAddress(highestBidder)}。`)
    }
  }).catch(() => {})
}

const handleBid = async () => {
  if (!userStore.isConnected) {
    ElMessage.warning('请先连接钱包')
    return
  }

  if (bidAmount.value < minBid.value) {
    ElMessage.warning(`出价不能低于 ${minBid.value} ETH`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认提交竞拍出价 ${bidAmount.value} ETH？`,
      '竞拍确认',
      { 
        confirmButtonText: '确认出价',
        cancelButtonText: '取消',
        type: 'info' 
      }
    )

    bidding.value = true
    
    // 💡 修复逻辑：处理模拟数据出价
    if (auction.value.auctionId.toString().startsWith('mock-')) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // 为了让 Ganache 余额真的减少，我们发起一个真实的转账交易
      // 转给一个随机生成的地址，模拟“竞拍支出”
      const randomAddr = ethers.Wallet.createRandom().address
      const tx = await signer.sendTransaction({
        to: randomAddr,
        value: ethers.parseEther(bidAmount.value.toString())
      })
      
      ElMessage.info('正在处理模拟竞拍交易...')
      await tx.wait()
      
      // 更新本地 UI 状态
      const newBid = {
        bidderAddress: userStore.address,
        amount: bidAmount.value.toString(),
        createdAt: Date.now(),
        txHash: tx.hash
      }
      bidHistory.value = [newBid, ...bidHistory.value]
      auction.value.highestBid = bidAmount.value.toString()
      auction.value.highestBidder = userStore.address

      // 持久化到“我的竞拍”列表，标记为正在参与
      const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
      mockBids[auction.value.auctionId] = {
        id: auction.value.auctionId,
        title: auction.value.artwork?.name,
        imageUrl: auction.value.artwork?.imageUrl,
        currentPrice: auction.value.highestBid,
        myPrice: auction.value.highestBid,
        endTime: new Date(auction.value.endTime).toISOString(),
        bidStatus: 'active'
      }
      localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))
      
      // 刷新余额
      await userStore.refreshBalance()
      ElMessage.success('模拟出价成功！您的 Ganache 余额已扣除。')

      // 🎮 触发机器人反击评估
      triggerSimulationBotRevenge()
    } else {
      // 真实合约出价
      await placeBid(auction.value.auctionId, bidAmount.value.toString())
      ElMessage.success('出价成功！交易已上链，正在等待区块确认...')
      
      // 🎮 即使是真实合约，也可以在本地前端模拟机器人的“心理反应”
      // 只要机器人服务 (bot-service.ts) 在后台运行，它就会通过监听事件来反击
      // 这里我们可以不需要手动调用，但为了演示流畅性，我们可以主动提示
      setTimeout(fetchAuctionDetail, 3000)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '出价失败')
    }
  } finally {
    bidding.value = false
  }
}

const handleEndAuction = async () => {
  try {
    await ElMessageBox.confirm(
      '确认结束并结算此拍卖？结算后资金将转给卖家，艺术品将转给最高出价者。',
      '结算确认',
      { 
        confirmButtonText: '立即结算',
        cancelButtonText: '取消',
        type: 'warning' 
      }
    )

    ending.value = true
    
    // 拦截模拟数据，模拟合约结算
    if (auction.value.auctionId.toString().startsWith('mock-')) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
      
      auction.value.status = 4 // 已结算
      
      // 更新本地存储中的竞拍状态为“竞拍成功”
      const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
      if (mockBids[auction.value.auctionId]) {
        mockBids[auction.value.auctionId].bidStatus = 'won'
        localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))
      }
      
      // 模拟结算收入（假设你是卖家，成交价的 95% 转入你的余额，5% 为手续费）
      if (auction.value.sellerAddress === userStore.address) {
        const finalPrice = parseFloat(auction.value.highestBid)
        const income = finalPrice * 0.95
        const currentBalance = parseFloat(userStore.balance)
        const newBalance = (currentBalance + income).toFixed(3)
        userStore.setBalance(newBalance)
        ElMessage.success(`拍卖结算成功！收入已转入您的钱包: ${income.toFixed(3)} ETH`)
      } else {
        ElMessage.success('结算已完成')
      }
      
      console.log('[Debug] Mock Settlement Tx:', mockTxHash)
    } else {
      await endAuction(auction.value.auctionId)
      ElMessage.success('结算指令已发送')
      setTimeout(fetchAuctionDetail, 5000)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '结算失败')
    }
  } finally {
    ending.value = false
  }
}

const handleAuctionEnd = () => {
  if (battleState.value === 'success' || isCancelled.value) return

  ElMessage.info('拍卖已到达截止时间')
  fetchAuctionDetail().then(() => {
    // 检查是否是赢家
    const highestBidder = bidHistory.value[0]?.bidderAddress
    if (highestBidder?.toLowerCase() === userStore.address.toLowerCase()) {
      battleState.value = 'success'
      isCancelled.value = true // 同样用于锁定 UI
      settleTime.value = dayjs().format('YYYY/MM/DD HH:mm:ss')
      ElMessage.success('恭喜！您在最后一刻成功赢得了本次竞拍！')
    } else {
      battleState.value = 'cancelled'
      isCancelled.value = true
      settleTime.value = dayjs().format('YYYY/MM/DD HH:mm:ss')
    }
  })
}

onMounted(() => {
  fetchAuctionDetail()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchAuctionDetail()
  }
})
</script>

<style lang="scss" scoped>
.auction-detail-page {
  padding: 40px 0;
  background-color: #f8f9fa;
  min-height: 100vh;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .breadcrumb {
    margin-bottom: 30px;
  }

  .main-content {
    margin-bottom: 40px;
  }

  .image-card {
    background: #fff;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);

    .image-wrapper {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1/1;
      background: #f0f0f0;

      .main-image {
        width: 100%;
        height: 100%;
        transition: transform 0.5s ease;
        &:hover {
          transform: scale(1.05);
        }
      }

      .verified-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 12px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: #409eff;
        font-weight: 600;
        font-size: 13px;
        backdrop-filter: blur(4px);
      }
    }

    .artwork-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .label {
          font-size: 12px;
          color: #999;
        }
        .value {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
      }
    }
  }

  .auction-card {
    padding: 10px 0;

    .header-info {
      margin-bottom: 25px;

      .title-row {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 12px;

        .title {
          font-size: 36px;
          font-weight: 800;
          color: #1a1a2e;
          margin: 0;
          line-height: 1.2;
        }

        .success-badge {
          font-size: 16px;
          padding: 8px 15px;
          border-radius: 8px;
          background-color: #67c23a;
          border: none;
        }
      }

      .status-tags {
        display: flex;
        gap: 10px;
        align-items: center;
      }
    }

    .creator-section {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;

      .profile-item {
        display: flex;
        align-items: center;
        gap: 12px;

        .gradient-avatar {
          background: linear-gradient(135deg, #6e8efb, #a777e3);
        }
        .owner-avatar {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          .label {
            font-size: 12px;
            color: #999;
          }
          .address {
            font-weight: 600;
            color: #333;
            font-family: monospace;
          }
        }
      }
    }

    .price-display-card {
      background: #1a1a2e;
      border-radius: 20px;
      padding: 30px;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      box-shadow: 0 15px 35px rgba(26, 26, 46, 0.2);

      .bid-info {
        .label {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          display: block;
          margin-bottom: 8px;
        }
        .price-value {
          display: flex;
          align-items: baseline;
          gap: 8px;
          .amount {
            font-size: 42px;
            font-weight: 800;
          }
          .unit {
            font-size: 20px;
            opacity: 0.8;
          }
        }
        .reserve-status {
          margin-top: 10px;
          .reserve-label {
            font-size: 12px;
            background: rgba(255,255,255,0.1);
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .timer-info {
        text-align: right;
        .label {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          display: block;
          margin-bottom: 12px;
          min-width: 60px;
        }

        .settle-time-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          color: #fff;
          font-family: monospace;
          justify-content: flex-end;
        }
      }
    }

    .auction-specs {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
      padding: 0 10px;

      .spec-item {
        .label {
          font-size: 14px;
          color: #999;
          display: block;
          margin-bottom: 4px;
        }
        .value {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }
      }
    }

    .action-section {
      background: #fff;
      border-radius: 20px;
      padding: 25px;
      border: 1px solid #eee;

      .bid-controls {
        display: flex;
        align-items: flex-start;
        gap: 20px;

        .bid-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .input-wrapper {
            position: relative;
            .input-unit {
              position: absolute;
              right: 40px;
              top: 50%;
              transform: translateY(-50%);
              color: #999;
              font-weight: 600;
              z-index: 10;
              pointer-events: none;
            }
            :deep(.el-input-number) {
              width: 100%;
              height: 56px;
              .el-input__inner {
                height: 56px;
                line-height: 56px;
                text-align: left;
                padding-left: 20px;
                font-weight: 700;
                font-size: 24px;
              }
            }
          }

          .min-bid-hint {
            font-size: 13px;
            color: #666;
            margin: 0;
            padding-left: 4px;
            strong {
              color: #1a1a2e;
            }
          }
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 160px;

          .bid-btn, .cancel-btn {
            width: 100%;
            height: 48px;
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            border-radius: 12px;
          }
        }
      }
    }

    .seller-actions {
      margin-top: 20px;
      .end-btn {
        width: 100%;
        border-radius: 12px;
        font-weight: 700;
      }
    }
  }

  .details-tabs {
    margin-top: 40px;
    
    .premium-tabs {
      background: #fff;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);

      :deep(.el-tabs__item) {
        font-size: 18px;
        font-weight: 600;
        height: 50px;
      }
    }

    .content-panel {
      padding: 20px 0;
      
      .description-text {
        font-size: 16px;
        line-height: 1.8;
        color: #555;
        white-space: pre-line;
      }

      .bidder-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        .addr {
          font-family: monospace;
          font-weight: 600;
        }
        .winner-tag {
          font-size: 10px;
        }
        .crown-icon {
          font-size: 20px;
          line-height: 1;
        }
      }

      .bid-amount {
        font-weight: 700;
        color: #1a1a2e;
      }

      .time-text {
        color: #999;
        font-size: 13px;
      }
    }

    .props-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;

      .prop-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #eee;
        .p-label {
          font-size: 12px;
          color: #999;
          display: block;
          margin-bottom: 8px;
        }
        .p-value {
          font-weight: 700;
          color: #333;
        }
      }
    }
  }
}

.premium-btn {
  background: linear-gradient(135deg, #1a1a2e 0%, #3a3a5e 100%);
  border: none;
  &:hover {
    background: linear-gradient(135deg, #2a2a4e 0%, #4a4a6e 100%);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(26, 26, 46, 0.3);
  }
}
</style>