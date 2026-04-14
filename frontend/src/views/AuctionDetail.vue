<template>
  <div class="auction-detail-page" v-loading="loading">
    <div class="container" v-if="auction">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/explore' }">探索</el-breadcrumb-item>
          <el-breadcrumb-item>拍卖详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-row :gutter="40" class="main-content">
        <!-- 作品图片区域 -->
        <el-col :xs="24" :md="12">
          <div class="image-card">
            <div class="image-wrapper">
              <el-image
                :src="auction.artwork?.imageUrl"
                fit="cover"
                class="main-image"
                :preview-src-list="auction.artwork?.imageUrl ? [auction.artwork.imageUrl] : []"
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
                <span class="label">原始文件</span>
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

        <!-- 拍卖操作区域 -->
        <el-col :xs="24" :md="12">
          <div class="auction-card">
            <div class="header-info">
              <div class="title-row">
                <h1 class="title">{{ auction.artwork?.name }}</h1>
                <el-tag v-if="battleState === 'success' || (auction.status === 4 && auction.highestBidder === userStore.address)" type="success" effect="dark" class="success-badge">
                  竞拍成功
                </el-tag>
                <el-tag v-else-if="auction.highestBidder === userStore.address" type="success" class="highest-bidder-tag">
                  最高出价者
                </el-tag>
                <el-tag v-else-if="auction.status === 4 && auction.highestBidder" type="info" effect="dark" class="success-badge">
                  已成交
                </el-tag>
              </div>
              <div class="status-tags">
                <el-tag :type="getStatusType(auction.status as number)" effect="dark">
                  {{ getStatusText(auction.status) }}
                </el-tag>
                <el-tag type="info" v-if="auction.txHash">
                  <el-link :href="getExplorerUrl(auction.txHash)" target="_blank" :underline="false">
                    区块链浏览器 <el-icon><TopRight /></el-icon>
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
            </div>

            <!-- 归属显示 (如果用户已拍得作品) -->
            <div v-if="isMine" class="owned-info-card">
              <div class="owned-header">
                <el-icon :size="48" class="check-icon"><CircleCheckFilled /></el-icon>
                <div class="owned-text">
                  <h3>恭喜！您已拥有该艺术品</h3>
                  <p>成交于 {{ settleTime || formatTime(auction.endTime) }}</p>
                </div>
              </div>
              <div class="owned-details">
                <div class="detail-item">
                  <span class="label">获得价格</span>
                  <span class="value">{{ formatPrice(auction.highestBid) }} ETH</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前所有者</span>
                  <span class="value">您 ({{ formatAddress(userStore.address) }})</span>
                </div>
              </div>
              <el-button type="primary" size="large" class="manage-btn" @click="$router.push('/profile')">
                在个人资料中查看
              </el-button>
            </div>

            <template v-else>
              <div class="price-display-card">
                <div class="bid-info">
                  <span class="label">当前最高价格</span>
                  <div class="price-value">
                    <span class="amount">{{ formatPrice(auction.highestBid || auction.startingPrice) }}</span>
                    <span class="unit">ETH</span>
                  </div>
                  <div class="reserve-status" v-if="Number(auction.reservePrice) > 0">
                    <el-tooltip :content="'保留价: ' + formatPrice(auction.reservePrice) + ' ETH'" placement="top">
                      <span class="reserve-label">
                        <el-icon><Lock /></el-icon>
                        {{ Number(auction.highestBid) >= Number(auction.reservePrice) ? '已达保留价' : '未达保留价' }}
                      </span>
                    </el-tooltip>
                  </div>
                </div>

                <div class="timer-info">
                  <span class="label">{{ (battleState === 'success' || isCancelled || auction.status === 4) ? '结算时间' : '距离结束' }}</span>
                  <div v-if="battleState === 'success' || isCancelled || auction.status === 4" class="settle-time-display">
                    <el-icon><Clock /></el-icon>
                    <span>{{ settleTime || formatTime(auction.endTime) }}</span>
                  </div>
                  <!-- 超时倒计时显示 -->
                  <div v-else-if="timeLeft > 0" class="timeout-countdown">
                    <el-icon><Clock /></el-icon>
                    <span class="timeout-text">等待中: {{ Math.ceil(timeLeft / 1000) }}s</span>
                    <span class="timeout-hint">若无更高出价，将自动成交</span>
                  </div>
                  <CountdownTimer v-else :endTime="auction.endTime" @end="handleAuctionEnd" />
                </div>
              </div>

              <div class="auction-specs">
                <div class="spec-item">
                  <span class="label">起拍价</span>
                  <span class="value">{{ formatPrice(auction.startingPrice) }} ETH</span>
                </div>
                <div class="spec-item">
                  <span class="label">最低加价</span>
                  <span class="value">{{ formatPrice(auction.minIncrement) }} ETH</span>
                </div>
              </div>

              <div class="action-section" v-if="auction.status === 1 && battleState !== 'success' && !isCancelled">
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
                    <p class="min-bid-hint">最低出价: <strong>{{ formatPrice(minBid) }} ETH</strong></p>
                  </div>

                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      size="large"
                      class="bid-btn premium-btn"
                      :loading="bidding"
                      :disabled="isCancelled || battleState !== 'active' || !isMyTurn"
                      @click="handleBid"
                    >
                      {{ !isMyTurn ? '等待他人出价' : '参与竞拍' }}
                    </el-button>
                    <el-button
                      type="danger"
                      size="large"
                      class="cancel-btn"
                      plain
                      :disabled="isCancelled"
                      @click="handleCancelBid"
                    >
                      退出竞拍
                    </el-button>
                  </div>
                </div>
              </div>
            </template>

            <div class="seller-actions" v-if="canEndAuction">
              <el-button
                type="danger"
                size="large"
                class="end-btn"
                plain
                :loading="ending"
                @click="handleEndAuction"
              >
                结束本次拍卖
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 详情选项卡 -->
      <el-row :gutter="40" class="details-tabs">
        <el-col :span="24">
          <el-tabs v-model="activeTab" class="premium-tabs">
            <el-tab-pane label="作品详情" name="desc">
              <div class="content-panel">
                <p class="description-text">{{ auction.artwork?.description || '暂无描述' }}</p>
              </div>
            </el-tab-pane>
            <el-tab-pane label="出价历史" name="history">
              <div class="content-panel">
                <el-table :data="bidHistory" style="width: 100%" class="history-table">
                  <el-table-column label="出价者" min-width="180">
                    <template #default="{ row, $index }">
                      <div class="bidder-cell">
                        <el-avatar :size="24" icon="User" />
                        <span class="addr">
                          {{ row.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase() ? '您' : (row.bidderName || formatAddress(row.bidderAddress)) }}
                        </span>
                        <span v-if="(isCancelled || battleState === 'success' || auction.status === 4) && $index === 0" class="crown-icon" title="竞拍获胜">🏆</span>
                        <el-tag v-else-if="$index === 0 && row.bidderAddress?.toLowerCase() === auction.highestBidder?.toLowerCase()" size="small" type="success" effect="plain" class="winner-tag">领先</el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" width="150">
                    <template #default="{ row }">
                      <span class="bid-amount">{{ formatPrice(row.amount) }} ETH</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="时间" width="180">
                    <template #default="{ row }">
                      <span class="time-text">{{ formatTime(row.createdAt) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="详情" width="100" align="right">
                    <template #default="{ row }">
                      <el-link v-if="row.txHash" :href="getExplorerUrl(row.txHash)" target="_blank">
                        <el-icon><TopRight /></el-icon>
                      </el-link>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-if="bidHistory.length === 0" description="暂无出价记录" />
              </div>
            </el-tab-pane>
            <el-tab-pane label="作品属性" name="props">
              <div class="content-panel props-grid">
                <div class="prop-card">
                  <span class="p-label">认证状态</span>
                  <span class="p-value">{{ auction.artwork?.isVerified ? '已认证' : '未认证' }}</span>
                </div>
                <div class="prop-card">
                  <span class="p-label">创建时间</span>
                  <span class="p-value">{{ formatTime(auction.artwork?.createdAt || '') }}</span>
                </div>
                <div class="prop-card">
                  <span class="p-label">创作者版税</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Link, Lock,
  CircleCheckFilled, TopRight, Clock
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { endAuction } from '@/utils/contracts'
import { getAuctionById, getBidHistory, recordBid, updateAuctionStatus } from '@/api/auction'
import CountdownTimer from '@/components/CountdownTimer.vue'
import { mockAuctions } from '@/utils/mockData'
import { formatPrice } from '@/utils/format'

// ==========================================
// 状态变量
// ==========================================
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const bidding = ref(false)
const ending = ref(false)
const isCancelled = ref(false)
const settleTime = ref('')
const battleState = ref<'waiting' | 'active' | 'success' | 'cancelled'>('waiting')
const pollTimer = ref<any>(null)
const hasParticipated = ref(false) // 新增：标记当前用户是否已参与竞拍

// 新增：竞拍超时相关状态
const lastBidTime = ref<number>(0)
const lastBidder = ref<string>('')
const timeoutTimer = ref<any>(null)
const isMyTurn = ref(true)  // 当前是否可以出价
const timeLeft = ref<number>(0)  // 剩余等待时间
const countdownInterval = ref<any>(null)

const auction = ref<any>(null)
const bidHistory = ref<any[]>([])
const bidAmount = ref(0)
const activeTab = ref('desc')

// ==========================================
// 实时竞拍数据管理
// ==========================================

// 启动轮询获取最新出价数据
const startBidPolling = () => {
  // 每 1.5 秒轮询一次，以保证在 3s 超时前获取到数据
  pollTimer.value = setInterval(async () => {
    if (!auction.value || auction.value.status !== 1 || isCancelled.value) {
      stopBidPolling()
      return
    }
    await refreshBidHistory()
  }, 1500)
}

// 停止轮询
const stopBidPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

// 刷新出价历史
const refreshBidHistory = async () => {
  if (!auction.value) return
  try {
    const id = auction.value.id || auction.value.auctionId
    const res = await getBidHistory(Number(id))
    
    // 关键：实时获取最新的拍卖基本信息（包含状态）
    const auctionRes = await getAuctionById(id)
    const latestAuctionData = auctionRes.data

    if (res.data && latestAuctionData) {
      const oldHighestBid = auction.value.highestBid
      const oldStatus = auction.value.status
      bidHistory.value = res.data
      
      // 更新本地拍卖对象的状态和最高价
      auction.value.status = latestAuctionData.status
      auction.value.highestBid = latestAuctionData.highestBid
      auction.value.highestBidder = latestAuctionData.highestBidder
      
      if (res.data.length > 0) {
        const topBid = res.data[0]
        
        // 只有当有真实最高出价者时才计算加价后的金额，否则保持起拍价
        if (topBid.bidderAddress && topBid.bidderAddress !== '0x...') {
          bidAmount.value = Number(topBid.amount) + Number(auction.value.minIncrement)
        } else {
          bidAmount.value = Number(auction.value.startingPrice)
        }

        // --- 核心修复：状态实时同步与支付唤起 ---
        // 如果后端状态已经变为成交 (4)
        if (auction.value.status === 4 && oldStatus === 1) {
          console.log('[Sync] Auction settled detected via polling')
          stopTimeoutCountdown()
          stopBidPolling()
          isCancelled.value = true
          settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
          
          const isWinner = topBid.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase()
          battleState.value = isWinner ? 'success' : 'cancelled'

          if (isWinner) {
            console.log('[Sync] I am the winner, triggering payment...')
            // 延迟一小会儿确保 UI 已渲染出获胜状态
            setTimeout(async () => {
              await handleWinnerPayment(topBid.bidderAddress, Number(topBid.amount))
            }, 500)
          } else {
            ElMessageBox.alert(
              `拍卖已结束，该作品由 ${formatAddress(topBid.bidderAddress)} 拍得。`,
              '竞拍结束',
              { confirmButtonText: '确定', type: 'info' }
            )
          }
          return
        }

        // 2. 检测到新的出价（正常竞价中）
        if (Number(oldHighestBid) !== Number(topBid.amount)) {
          lastBidTime.value = Date.now()
          lastBidder.value = topBid.bidderAddress

          if (topBid.bidderAddress?.toLowerCase() !== userStore.address?.toLowerCase()) {
            isMyTurn.value = true
            startTimeoutCountdown()
            
            // --- 核心修复：仅对参与过竞拍的用户弹出提示 ---
            if (hasParticipated.value) {
              handleOutbidQuery(topBid.amount)
            }
          } else {
            // 我出价成功，重置我的回合
            isMyTurn.value = false
            hasParticipated.value = true // 确保出价成功后标记为已参与
            startTimeoutCountdown()
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to refresh bid history:', err)
  }
}

// 被超过后弹出加价询问
const handleOutbidQuery = async (currentAmount: string | number) => {
  try {
    const nextAmount = Number(currentAmount) + Number(auction.value.minIncrement)
    
    await ElMessageBox.confirm(
      `有人出价超过了你！当前价格：${formatPrice(currentAmount)} ETH。你是否要加价竞拍？`,
      '有人加价',
      {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false
      }
    )
    
    // 用户点“是”：仅关闭弹窗，停留在详情页，让用户自己操作加价
    ElMessage.info('请在下方输入您的出价金额并点击“参与竞拍”')
    // 自动帮用户填好建议的最低价，方便用户操作
    bidAmount.value = Number(nextAmount.toFixed(4))
  } catch (action) {
    // 用户点“否”：退出竞拍
    if (action === 'cancel') {
      await handleCancelBid()
    }
  }
}

// ==========================================
// 3秒超时自动结算机制
// ==========================================

// 开始超时倒计时
const startTimeoutCountdown = () => {
  // 清除之前的倒计时
  stopTimeoutCountdown()

  timeLeft.value = 5000  // 改为 5 秒无人加价自动成交
  
  // 每秒更新时间显示
  countdownInterval.value = setInterval(() => {
    timeLeft.value -= 1000
    if (timeLeft.value <= 0) {
      stopTimeoutCountdown()
    }
  }, 1000)

  // 5秒后自动结算
  timeoutTimer.value = setTimeout(async () => {
    await handleTimeoutSettle()
  }, 5000)
}

// 停止超时倒计时
const stopTimeoutCountdown = () => {
  if (timeoutTimer.value) {
    clearTimeout(timeoutTimer.value)
    timeoutTimer.value = null
  }
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
  timeLeft.value = 0
}

// 超时自动结算
const handleTimeoutSettle = async () => {
  if (isCancelled.value || battleState.value === 'success') return
  if (!auction.value || auction.value.status !== 1) return

  // 确保是最新的出价
  await refreshBidHistory()

  const topBid = bidHistory.value[0]
  if (!topBid) return

  const winner = topBid.bidderAddress
  const winAmount = Number(topBid.amount)

  settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  isCancelled.value = true
  battleState.value = winner.toLowerCase() === userStore.address?.toLowerCase() ? 'success' : 'cancelled'

  // 立即更新本地 auction 状态，让 UI 渲染“竞拍成功”及“皇冠”
  auction.value.highestBid = winAmount.toString()
  auction.value.highestBidder = winner
  auction.value.status = 4
  auction.value.endTime = settleTime.value

  // 同步到数据库
  try {
    await updateAuctionStatus(auction.value.id || auction.value.auctionId, {
      status: 4,
      highestBid: winAmount,
      highestBidder: winner
    })
  } catch (err) {
    console.error('Failed to sync auction status:', err)
  }

  // 保存到本地记录
  const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  const auctionId = auction.value.id || auction.value.auctionId
  mockBids[auctionId] = {
    id: auctionId,
    title: auction.value.artwork?.name,
    imageUrl: auction.value.artwork?.imageUrl,
    currentPrice: winAmount.toString(),
    myPrice: bidHistory.value.find((b: any) => b.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase())?.amount,
    endTime: settleTime.value,
    bidStatus: winner.toLowerCase() === userStore.address?.toLowerCase() ? 'won' : 'lost'
  }
  localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))

  // 显示结算结果
  const isWinner = winner.toLowerCase() === userStore.address?.toLowerCase()
  const winnerName = isWinner ? '您' : (topBid.bidderName || formatAddress(winner))

  if (isWinner) {
    // 如果是赢家，尝试扣款
    await handleWinnerPayment(winner, winAmount)
  } else {
    ElMessageBox.alert(
      `拍卖超时无人继续出价，${winnerName} 以 ${formatPrice(winAmount)} ETH 拍得作品《${auction.value.artwork?.name}》！`,
      '拍卖结束',
      { confirmButtonText: '确定', type: 'warning' }
    )
  }
}

// 处理赢家支付
const handleWinnerPayment = async (winner: string, winAmount: number) => {
  const sellerAddress = auction.value.sellerAddress || auction.value.artwork?.creator

  if (sellerAddress && sellerAddress !== '0x...' && userStore.isConnected) {
    try {
      ElMessage.info('正在发起支付确认...')
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      if (!ethers.isAddress(sellerAddress)) {
        throw new Error('invalid address')
      }

      const tx = await signer.sendTransaction({
        to: sellerAddress,
        value: ethers.parseEther(winAmount.toString())
      })

      ElMessage.info('交易已发送，正在同步状态...')
      await tx.wait()

      // 成功后刷新余额
      await userStore.refreshBalance()

      ElMessageBox.alert(
        `恭喜！您以 ${formatPrice(winAmount)} ETH 拍得作品《${auction.value.artwork?.name}》！\n\n交易哈希: ${tx.hash.slice(0, 10)}...`,
        '竞拍成功',
        { confirmButtonText: '确定', type: 'success' }
      )
    } catch (error: any) {
      console.error('支付失败:', error)
      ElMessageBox.alert(
        `恭喜！您已拍得作品《${auction.value.artwork?.name}》！\n\n请稍后完成支付以获得作品所有权。`,
        '竞拍成功（待支付）',
        { confirmButtonText: '确定', type: 'success' }
      )
    }
  } else {
    ElMessageBox.alert(
      `恭喜！您以 ${formatPrice(winAmount)} ETH 拍得作品《${auction.value.artwork?.name}》！`,
      '竞拍成功',
      { confirmButtonText: '确定', type: 'success' }
    )
  }
}

// 最终结算结果
const finalizeBidResult = async (isWinner: boolean) => {
  const myBid = bidHistory.value.find(
    b => b.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase()
  )
  const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  mockBids[auction.value.auctionId] = {
    id: auction.value.auctionId,
    title: auction.value.artwork?.name,
    imageUrl: auction.value.artwork?.imageUrl,
    currentPrice: auction.value.highestBid,
    myPrice: myBid?.amount,
    endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    bidStatus: isWinner ? 'won' : 'lost'
  }
  localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))

  if (isWinner) {
    const winAmount = Number(myBid?.amount)
    const sellerAddress = auction.value.sellerAddress || auction.value.artwork?.creator

    // 立即更新状态为已完成（下架）
    const nowStr = dayjs().format('YYYY-MM-DD HH:mm:ss')
    auction.value.status = 4
    auction.value.endTime = nowStr
    battleState.value = 'success'
    isCancelled.value = true
    settleTime.value = nowStr

    // 同步到数据库
    try {
      await updateAuctionStatus(auction.value.auctionId, {
        status: 4,
        highestBid: auction.value.highestBid,
        highestBidder: auction.value.highestBidder
      })
    } catch (err) {
      console.error('Failed to sync auction status to DB:', err)
    }

    if (sellerAddress && sellerAddress !== '0x...' && userStore.isConnected) {
      try {
        ElMessage.info('正在发起支付确认...')
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        // 校验目标地址是否合法，防止 Ethers v6 触发 ENS 解析错误
        if (!ethers.isAddress(sellerAddress)) {
          console.warn('无效的卖家地址，跳过链上支付环节:', sellerAddress)
          throw new Error('invalid address')
        }

        const tx = await signer.sendTransaction({
          to: sellerAddress,
          value: ethers.parseEther(winAmount.toString())
        })

        ElMessage.info('交易已发送，正在同步状态...')
        await tx.wait()

        const newBalance = (parseFloat(userStore.balance) - winAmount).toFixed(4)
        userStore.setBalance(newBalance < '0' ? '0' : newBalance)

        ElMessageBox.alert(
          `恭喜！当前无人竞争，您已直接拍得作品《${auction.value.artwork?.name}》！\n\n作品已成功归属于您并从拍卖行下架。\n支付金额: ${formatPrice(myBid?.amount)} ETH\n交易哈希: ${tx.hash.slice(0, 10)}...`,
          '竞拍成功并已成交',
          { confirmButtonText: '确定', type: 'success' }
        )
      } catch (error: any) {
        console.error('支付失败:', error)
        ElMessageBox.alert(
          `恭喜！当前无人竞争，您已成功锁定作品《${auction.value.artwork?.name}》！\n\n由于支付被取消，作品已为您保留，请稍后在“我的竞拍”中完成结算。\n作品当前已从市场下架。`,
          '竞拍锁定',
          { confirmButtonText: '确定', type: 'success' }
        )
      }
    } else {
      ElMessageBox.alert(
        `恭喜！当前无人竞争，您已直接拍得作品《${auction.value.artwork?.name}》！\n\n该作品已下架并归属于您的名下。`,
        '竞拍成功',
        { confirmButtonText: '确定', type: 'success' }
      )
    }
  } else {
    battleState.value = 'cancelled'
    isCancelled.value = true
    settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const winner = bidHistory.value[0]
    ElMessageBox.alert(
      `拍卖已结束，很遗憾您未能拍得 ${auction.value.artwork?.name}。最终成交价为 ${formatPrice(winner.amount)} ETH，由 ${winner.bidderName} 拍得。`,
      '拍卖结束',
      { confirmButtonText: '确定', type: 'warning' }
    )
  }
}

// 参与竞拍
const handleBid = async (skipConfirm = false) => {
  if (!userStore.isConnected) {
    ElMessage.warning('请先连接钱包'); return
  }

  // 增加状态校验：非“进行中”状态禁止出价
  if (auction.value.status !== 1) {
    ElMessage.error('该拍卖已结束或已成交，无法继续出价'); return
  }

  // 出价前强制刷新一次余额，确保数据最新
  await userStore.refreshBalance()

  if (bidAmount.value < minBid.value) {
    ElMessage.warning(`最低出价必须大于 ${formatPrice(minBid.value)} ETH`); return
  }

  // 检查余额是否足够
  const bidAmountInEth = Number(bidAmount.value)
  const myBalance = parseFloat(userStore.balance)

  if (bidAmountInEth > myBalance) {
    ElMessageBox.alert(
      `您的出价 ${formatPrice(bidAmountInEth)} ETH 超出您当前钱包余额 ${formatPrice(myBalance)} ETH。\n\n余额不足，无法参与竞拍。`,
      '余额不足',
      { confirmButtonText: '确定', type: 'danger' }
    )
    return
  }

  if (!skipConfirm) {
    try {
      await ElMessageBox.confirm(
        `您确定要出价 ${formatPrice(bidAmount.value)} ETH 吗？5秒后若无更高出价，您将获得该作品。`, '确认出价',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
      )
    } catch { return }
  }

  bidding.value = true

  const userBid = {
    bidderName: '我',
    bidderAddress: userStore.address,
    amount: Number(bidAmount.value),
    createdAt: Date.now()
  }

  // 同步出价到数据库
  try {
    const res = await recordBid({
      auctionId: auction.value.id || auction.value.auctionId,
      bidderAddress: userStore.address,
      amount: bidAmount.value.toString() // 使用字符串提交，保证精度
    })

    if (res && res.data) {
      // 标记为已参与，后续别人加价将弹出提示
      hasParticipated.value = true

      // 数据库同步成功，再更新本地状态
      bidHistory.value = [userBid, ...bidHistory.value]
      auction.value.highestBid = bidAmount.value.toString()
      auction.value.highestBidder = userStore.address

      // 重置超时状态：我是最新出价者，等待其他人
      lastBidTime.value = Date.now()
      lastBidder.value = userStore.address
      isMyTurn.value = false // 我刚出过价，必须等别人出价后才能再出
      startTimeoutCountdown()

      ElMessage.success('出价已提交！等待其他竞拍者...')
      
      // 立即同步一次最新历史
      await refreshBidHistory()
    }
  } catch (err: any) {
    console.error('Failed to record bid to DB:', err)
    const errorMsg = err.response?.data?.message || '服务器繁忙，请稍后再试'
    ElMessage.error(`出价失败: ${errorMsg}`)
  } finally {
    bidding.value = false
  }
}

// 余额超出时的结算处理
const handleBalanceExceededSettle = async () => {
  if (isCancelled.value || battleState.value === 'success') return

  await refreshBidHistory()

  const topBid = bidHistory.value[0]
  if (!topBid) return

  const winner = topBid.bidderAddress
  const winAmount = Number(topBid.amount)

  settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  isCancelled.value = true
  battleState.value = winner.toLowerCase() === userStore.address?.toLowerCase() ? 'success' : 'cancelled'

  auction.value.highestBid = winAmount.toString()
  auction.value.highestBidder = winner
  auction.value.status = 4
  auction.value.endTime = settleTime.value

  try {
    await updateAuctionStatus(auction.value.auctionId, {
      status: 4,
      highestBid: winAmount,
      highestBidder: winner
    })
  } catch (err) {
    console.error('Failed to sync auction status:', err)
  }

  const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  mockBids[auction.value.auctionId] = {
    id: auction.value.auctionId,
    title: auction.value.artwork?.name,
    imageUrl: auction.value.artwork?.imageUrl,
    currentPrice: winAmount.toString(),
    myPrice: bidHistory.value.find((b: any) => b.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase())?.amount,
    endTime: settleTime.value,
    bidStatus: winner.toLowerCase() === userStore.address?.toLowerCase() ? 'won' : 'lost'
  }
  localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))
}

// 退出竞拍
const handleCancelBid = async () => {
  try {
    await ElMessageBox.confirm(
      '您确定要放弃加价吗？系统将按当前最高出价结算，作品归属最高出价者。',
      '放弃竞拍',
      { confirmButtonText: '确定', cancelButtonText: '我再想想', type: 'warning' }
    )
  } catch {
    return
  }

  if (!auction.value) return

  // 确保结算前获取最新出价
  await refreshBidHistory()

  const topBid = bidHistory.value[0]
  if (!topBid) {
    ElMessage.warning('当前没有有效出价，无法执行结算')
    return
  }

  const finalHighestBid = Number(topBid.amount)
  const finalHighestBidder = topBid.bidderAddress

  settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  isCancelled.value = true
  
  const isWinner = finalHighestBidder.toLowerCase() === userStore.address?.toLowerCase()
  battleState.value = isWinner ? 'success' : 'cancelled'

  auction.value.highestBid = finalHighestBid.toString()
  auction.value.highestBidder = finalHighestBidder
  auction.value.status = 4
  auction.value.endTime = settleTime.value

  // 同步到数据库
  try {
    await updateAuctionStatus(auction.value.id || auction.value.auctionId, {
      status: 4,
      highestBid: finalHighestBid,
      highestBidder: finalHighestBidder
    })
  } catch (err) {
    console.error('Failed to settle auction on cancel:', err)
  }

  // 本地存储
  const myBid = bidHistory.value.find(
    b => b.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase()
  )
  const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
  const auctionId = auction.value.id || auction.value.auctionId
  mockBids[auctionId] = {
    id: auctionId,
    title: auction.value.artwork?.name,
    imageUrl: auction.value.artwork?.imageUrl,
    currentPrice: finalHighestBid.toString(),
    myPrice: myBid?.amount,
    endTime: settleTime.value,
    bidStatus: isWinner ? 'won' : 'lost'
  }
  localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))

  if (isWinner) {
    await handleWinnerPayment(finalHighestBidder, finalHighestBid)
  } else {
    ElMessageBox.alert(
      `已完成结算，作品归属 ${isWinner ? '您' : formatAddress(finalHighestBidder)}，成交价 ${formatPrice(finalHighestBid)} ETH。`,
      '结算完成',
      { confirmButtonText: '确定', type: 'success' }
    )
  }
}

// ==========================================
// 计算属性与工具
// ==========================================

const isMine = computed(() => {
  if (!auction.value || !userStore.isConnected) return false
  return (
    auction.value.highestBidder?.toLowerCase() === userStore.address?.toLowerCase() &&
    (auction.value.status === 4 || battleState.value === 'success')
  )
})

const minBid = computed(() => {
  if (!auction.value) return 0
  const highest = Number(auction.value.highestBid) || 0
  const starting = Number(auction.value.startingPrice) || 0
  const increment = Number(auction.value.minIncrement) || 0.01
  
  // 如果没有人出价，最低出价为 起拍价 + 最低加价 (根据用户新需求)
  if (!auction.value.highestBidder || auction.value.highestBidder === '0x...') {
    return Number((starting + increment).toFixed(4))
  }
  
  // 有人出价时，最低出价 = 当前最高价 + 最低加价
  const result = Number((highest + increment).toFixed(4))
  return result
})

// 监听最低出价变化，自动更新输入框
watch(minBid, (newVal) => {
  if (bidAmount.value < newVal) {
    bidAmount.value = newVal
  }
}, { immediate: true })

const canEndAuction = computed(() => {
  if (!auction.value || !userStore.isConnected) return false
  const now = Date.now()
  const endTime = new Date(auction.value.endTime).getTime()
  return (
    auction.value.status === 1 &&
    now >= endTime &&
    userStore.address.toLowerCase() === auction.value.sellerAddress?.toLowerCase()
  )
})

const formatAddress = (address: string | undefined | null) => {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return '0x...'
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatTime = (time: string | number | Date) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getExplorerUrl = (txHash: string) =>
  `https://sepolia.etherscan.io/tx/${txHash}`

const getStatusType = (status: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  if (battleState.value === 'success') return 'info'
  if (isCancelled.value) return 'danger'
  const map: Record<number, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    0: 'warning', 1: 'success', 2: 'info', 3: 'danger', 4: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  if (battleState.value === 'success') return '已成交'
  if (isCancelled.value) return '已结束'
  return {
    0: '待发布', 1: '拍卖中', 2: '待结算', 3: '已流拍', 4: '已完成'
  }[status] || '未知'
}

const fetchAuctionDetail = async () => {
  auction.value = null
  bidHistory.value = []

  const idParam = route.params.id
  if (!idParam) return

  const id = String(idParam).trim()
  const isMock = id.startsWith('mock-') || isNaN(Number(id))

  if (isMock) {
    const foundMock = mockAuctions.find(m => m.auctionId === id)
    // 同时也从本地发布的作品中查找
    const localCreated = JSON.parse(localStorage.getItem('MOCK_CREATED_AUCTIONS') || '[]')
    const foundLocal = localCreated.find((m: any) => m.auctionId === id)
    
    const finalFound = foundLocal || foundMock

    if (finalFound) {
      auction.value = JSON.parse(JSON.stringify(finalFound))

      // 强制为进行中且设置未来时间（除非本地已成交）
      const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
      const savedBid = localMockBids[id]
      
      if (savedBid?.bidStatus === 'won') {
        auction.value.highestBid = savedBid.currentPrice
        auction.value.highestBidder = userStore.address
        auction.value.status = 4
        auction.value.endTime = savedBid.endTime
        battleState.value = 'success'
        isCancelled.value = true
        settleTime.value = savedBid.endTime
      } else if (savedBid?.bidStatus === 'lost') {
        // 已竞拍失败：强制显示为已结束且不可再操作
        auction.value.highestBid = savedBid.currentPrice || auction.value.highestBid
        // 保留原最高出价者，无需等于我
        auction.value.status = 4
        auction.value.endTime = savedBid.endTime || Date.now()
        battleState.value = 'cancelled'
        isCancelled.value = true
        settleTime.value = savedBid.endTime || dayjs().format('YYYY-MM-DD HH:mm:ss')
      } else {
        auction.value.status = 1
        auction.value.endTime = Date.now() + 3 * 24 * 60 * 60 * 1000
      }
    } else {
      auction.value = {
        auctionId: id,
        artwork: {
          name: '暂无数据',
          imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8',
          description: '这是一件精美的数字艺术品，具有极高的收藏价值。',
          creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
        },
        startingPrice: '1.0',
        highestBid: '1.5',
        minIncrement: '0.1',
        status: 1,
        endTime: Date.now() + 86400000
      }
    }

    bidAmount.value = Number(auction.value.highestBid) + Number(auction.value.minIncrement)
    loading.value = false

    // 启动轮询获取实时出价
    if (battleState.value === 'waiting') {
      battleState.value = 'active'
      startBidPolling()
    }
    return
  }

  loading.value = true
  try {
    const res = await getAuctionById(Number(id))
    auction.value = res.data
    
    // 如果拍卖已过结束时间但状态还是 Active，前端显示为 Ended
    if (auction.value && auction.value.status === 1) {
      if (new Date(auction.value.endTime).getTime() <= Date.now()) {
        auction.value.status = 2
      }
    }

    const historyRes = await getBidHistory(Number(id))
    bidHistory.value = historyRes.data || []
    
    // 初始化参与状态：检查当前用户是否已在该出价历史中
    if (userStore.address && bidHistory.value.length > 0) {
      hasParticipated.value = bidHistory.value.some(
        (b: any) => b.bidderAddress?.toLowerCase() === userStore.address?.toLowerCase()
      )
    }

    bidAmount.value = minBid.value
    
    // 启动轮询获取实时出价
    if (battleState.value === 'waiting') {
      battleState.value = 'active'
      startBidPolling()
    }
  } catch (error) {
    console.error('Failed to fetch auction:', error)
    ElMessage.error('加载拍卖详情失败')
  } finally {
    loading.value = false
  }
}

const handleEndAuction = async () => {
  try {
    await ElMessageBox.confirm(
      '您确定要手动结束本次拍卖吗？这将立即结算当前的最高出价。',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  ending.value = true

  if (auction.value.auctionId?.toString().startsWith('mock-')) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    auction.value.status = 4
    const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
    if (mockBids[auction.value.auctionId]) {
      mockBids[auction.value.auctionId].bidStatus = 'won'
      localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))
    }
    if (auction.value.sellerAddress === userStore.address) {
      const income = parseFloat(auction.value.highestBid) * 0.95
      userStore.setBalance((parseFloat(userStore.balance) + income).toFixed(4))
      ElMessage.success(`结算成功！收益 ${formatPrice(income)} ETH 已发送至您的钱包（已扣除 5% 平台服务费）。`)
    } else {
      ElMessage.success('拍卖已结束')
    }
  } else {
    await endAuction(Number(auction.value.auctionId))
    ElMessage.success('合约操作成功：拍卖已结算')
    setTimeout(fetchAuctionDetail, 5000)
  }

  ending.value = false
}

const handleAuctionEnd = () => {
  if (battleState.value === 'success' || isCancelled.value) return
  ElMessage.info('拍卖已到期，正在结算结果...')
  fetchAuctionDetail().then(() => {
    const highestBidder = bidHistory.value[0]?.bidderAddress
    if (highestBidder?.toLowerCase() === userStore.address?.toLowerCase()) {
      battleState.value = 'success'
      isCancelled.value = true // 锁定 UI
      const winTime = dayjs().format('YYYY/M/D HH:mm:ss')
      settleTime.value = winTime
      ElMessage.success('恭喜！您在本次竞拍中胜出！')
    } else {
      battleState.value = 'cancelled'
      isCancelled.value = true
      settleTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  })
}

onMounted(async () => {
  await fetchAuctionDetail()
  
  // 如果当前最高出价者是我，则禁用出价按钮
  if (auction.value?.highestBidder?.toLowerCase() === userStore.address?.toLowerCase()) {
    isMyTurn.value = false
    startTimeoutCountdown()
  } else {
    isMyTurn.value = true
  }
})

onUnmounted(() => {
  stopBidPolling()
  stopTimeoutCountdown()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    stopBidPolling()
    fetchAuctionDetail()
  }
})

// 监听用户钱包地址变化，重新检查参与状态
watch(() => userStore.address, (newAddr) => {
  if (newAddr && bidHistory.value.length > 0) {
    hasParticipated.value = bidHistory.value.some(
      (b: any) => b.bidderAddress?.toLowerCase() === newAddr.toLowerCase()
    )
  } else {
    hasParticipated.value = false
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

        .timeout-countdown {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          .timeout-text {
            font-size: 20px;
            font-weight: 700;
            color: #67c23a;
            font-family: monospace;
          }
          .timeout-hint {
            font-size: 11px;
            color: rgba(255,255,255,0.6);
          }
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
            strong {
              color: #1a1a2e;
            }
          }
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 160px;

          .bid-btn {
            height: 56px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
          }
          .cancel-btn {
            height: 48px;
            border-radius: 12px;
          }
        }
      }
    }

    .owned-info-card {
      background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
      border-radius: 20px;
      padding: 30px;
      border: 2px solid #e1f3d8;
      box-shadow: 0 10px 25px rgba(103, 194, 58, 0.1);
      margin-bottom: 30px;

      .owned-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 25px;

        .check-icon {
          color: #67c23a;
        }

        .owned-text {
          h3 {
            margin: 0 0 4px 0;
            font-size: 22px;
            color: #1a1a2e;
            font-weight: 700;
          }
          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }
      }

      .owned-details {
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 25px;
        display: flex;
        flex-direction: column;
        gap: 15px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .label {
            color: #999;
            font-size: 14px;
          }
          .value {
            color: #1a1a2e;
            font-weight: 600;
            font-size: 16px;
          }
        }
      }

      .manage-btn {
        width: 100%;
        height: 50px;
        border-radius: 12px;
        font-weight: 600;
        letter-spacing: 1px;
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
