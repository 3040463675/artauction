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
              <h1 class="title">{{ auction.artwork?.name }}</h1>
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

              <div class="timer-info" v-if="auction.status === 1">
                <span class="label">拍卖截止</span>
                <CountdownTimer :endTime="auction.endTime" @end="handleAuctionEnd" />
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
                <div class="input-wrapper">
                  <el-input-number
                    v-model="bidAmount"
                    :min="minBid"
                    :step="Number(auction.minIncrement)"
                    :precision="4"
                    size="large"
                    controls-position="right"
                  />
                  <span class="input-unit">ETH</span>
                </div>
                <el-button
                  type="primary"
                  size="large"
                  class="bid-btn premium-btn"
                  :loading="bidding"
                  @click="handleBid"
                >
                  立即竞拍
                </el-button>
              </div>
              <p class="min-bid-hint">最低有效出价: <strong>{{ minBid }} ETH</strong></p>
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
                    <template #default="{ row }">
                      <div class="bidder-cell">
                        <el-avatar :size="24" icon="User" />
                        <span class="addr">{{ formatAddress(row.bidderAddress) }}</span>
                        <el-tag v-if="row.bidderAddress === auction.highestBidder" size="small" type="success" effect="plain" class="winner-tag">最高</el-tag>
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
  CircleCheckFilled, TopRight 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { placeBid, endAuction } from '@/utils/contracts'
import { getAuctionById, getBidHistory } from '@/api/auction'
import CountdownTimer from '@/components/CountdownTimer.vue'

// 1. 模拟数据映射表移至顶部，确保任何时候都可用
const MOCK_DATA_MAP: Record<string, any> = {
  'mock-a1': { 
    name: '未来之光', 
    img: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8', 
    price: '1.5', 
    desc: '这件作品是数字艺术的一次大胆尝试，通过复杂的算法重构了光影与空间的比例。',
    creator: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f',
    seller: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'
  },
  'mock-a2': { 
    name: '深海共鸣', 
    img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262', 
    price: '2.8', 
    desc: '探索深海最深处的宁now与力量，蓝色调的层叠展现了水的生命力。',
    creator: '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1',
    seller: '0x2546beee84594a58739265b82269e7a310237190'
  },
  'mock-a3': { 
    name: '数字荒原', 
    img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5', 
    price: '0.9', 
    desc: '在荒凉的数字世界中寻找秩序，混乱与平衡的极致体现。',
    creator: '0xfe629b7f6075cf9af684060854580f6cc44666da',
    seller: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
  },
  'mock-a4': { 
    name: '城市之巅', 
    img: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb', 
    price: '3.2', 
    desc: '俯瞰繁华都市的璀璨灯火，捕捉现代文明跳动的脉搏。',
    creator: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    seller: '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1'
  },
  'mock-a5': { 
    name: '最后的晚餐 - 重构', 
    img: 'https://images.unsplash.com/photo-1554188248-986adbb73be4', 
    price: '5.6', 
    desc: '用现代抽象手法解构经典，赋予传统艺术全新的数字生命。',
    creator: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
    seller: '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc'
  },
  'mock-a6': { 
    name: '赛博霓虹', 
    img: 'https://images.unsplash.com/photo-1614728263952-84ea206f25bc', 
    price: '1.2', 
    desc: '霓虹闪烁的未来城市夜景，电子梦境与现实的交织。',
    creator: '0x976ea74026e726554db657fa54763abd0c3a0aa9',
    seller: '0x14dc79964da2c08b23698b3d3cc7ca32193d9955'
  },
  'mock-a7': { 
    name: '意识流转', 
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 
    price: '0.5', 
    desc: '心灵深处思绪的无声流动，如水般自然，如风般变幻。',
    creator: '0x23618e81e3f5cdf7f54c3d65f7fbc0abfb21e8f',
    seller: '0xa0ee7a142d267c1f36714e4a8f75612f20a79720'
  },
  'mock-a8': { 
    name: '量子纠缠', 
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 
    price: '4.1', 
    desc: '微观世界的奇妙连接，跨越空间的无形纽带。',
    creator: '0xbcd4042de499d14e55001ccbb24a551f3b9d933f',
    seller: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f'
  }
}

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const bidding = ref(false)
const ending = ref(false)
const auction = ref<any>(null)
const bidHistory = ref<any[]>([])
const bidAmount = ref(0)
const activeTab = ref('desc')

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
  
  // 兼容性处理：如果 ID 是 'mock1' 这种格式，自动转为 'mock-a1'
  const normalizedId = id.startsWith('mock') && !id.includes('-a') 
    ? id.replace('mock', 'mock-a') 
    : id
    
  console.log('[Debug] Fetching Detail for ID:', normalizedId)
  
  // 检查是否为模拟数据 ID
  const isMock = normalizedId.startsWith('mock-') || isNaN(Number(normalizedId))

  if (isMock) {
    const data = MOCK_DATA_MAP[normalizedId]
    if (!data) {
      console.warn(`[Warning] Mock ID "${normalizedId}" not found, falling back to mock-a1`)
    }
    const targetData = data || MOCK_DATA_MAP['mock-a1']
    const currentUser = userStore.address || '0x29193796d84135' // 优先使用已连接地址

    console.log('[Debug] Mapping to artwork:', targetData.name)

    auction.value = {
      id: normalizedId,
      auctionId: normalizedId,
      artwork: {
        name: targetData.name,
        imageUrl: targetData.img,
        description: targetData.desc,
        creator: normalizedId === 'mock-a1' ? currentUser : (targetData.creator || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'),
        tokenId: 1000 + (Object.keys(MOCK_DATA_MAP).indexOf(normalizedId) + 1 || 1),
        isVerified: true,
        createdAt: Date.now() - 86400000 * 3
      },
      sellerAddress: normalizedId === 'mock-a1' ? currentUser : (targetData.seller || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'),
      startingPrice: (Number(targetData.price) * 0.6).toFixed(1),
      highestBid: targetData.price,
      minIncrement: '0.1',
      status: 1,
      endTime: Date.now() + 86400000,
      txHash: '0x9560f64c636f3c9e99a7a972174c35e58989506691c7f55c3c3a0937a069a538'
    }
    
    bidHistory.value = [
      {
        bidderAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        amount: targetData.price,
        createdAt: Date.now() - 3600000,
        txHash: '0x123...abc'
      },
      {
        bidderAddress: '0x2546BEee84594A58739265B82269E7A310237190',
        amount: (Number(targetData.price) * 0.8).toFixed(1),
        createdAt: Date.now() - 7200000,
        txHash: '0x456...def'
      }
    ]
    
    bidAmount.value = Number(auction.value.highestBid) + 0.1
    return
  }

  loading.value = true
  try {
    const res = await getAuctionById(Number(id))
    auction.value = res.data
    
    const historyRes = await getBidHistory(Number(id))
    bidHistory.value = historyRes.data || []
    
    bidAmount.value = minBid.value
  } catch (error) {
    console.error('Failed to fetch auction:', error)
    ElMessage.error('获取拍卖详情失败')
  } finally {
    loading.value = false
  }
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
    
    // 针对模拟数据，执行真实的链上转账交易
    if (auction.value.auctionId.toString().startsWith('mock-')) {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // 构造一个真实的以太币转账交易
      // 转账给当前作品的持有者（模拟竞拍支付到合约/卖家）
      const tx = await signer.sendTransaction({
        to: auction.value.sellerAddress || '0x0000000000000000000000000000000000000000',
        value: ethers.parseEther(bidAmount.value.toString())
      })
      
      ElMessage.info('交易已提交到区块链，等待确认...')
      const receipt = await tx.wait()
      
      // 交易成功后的逻辑
      const mockTxHash = receipt?.hash || tx.hash
      
      const newBid = {
        bidderAddress: userStore.address,
        amount: bidAmount.value.toString(),
        createdAt: Date.now(),
        txHash: mockTxHash
      }
      
      bidHistory.value.unshift(newBid)
      auction.value.highestBid = bidAmount.value.toString()
      
      // 保存模拟竞拍记录到本地存储
      const mockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
      mockBids[auction.value.auctionId] = {
        id: auction.value.auctionId,
        title: auction.value.artwork?.name || '未知作品',
        imageUrl: auction.value.artwork?.imageUrl || '', 
        currentPrice: bidAmount.value.toString(),
        myPrice: bidAmount.value.toString(),
        endTime: auction.value.endTime,
        bidStatus: 'won', // 既然已经给卖家转账了，直接标记为竞拍成功
        txHash: mockTxHash
      }
      localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(mockBids))
      
      // 更新当前页面显示的状态
      auction.value.status = 4 // 标记为已结算/已完成
      auction.value.highestBidder = userStore.address
      
      // 刷新余额（从链上获取最新余额）
      await userStore.refreshBalance()
      
      ElMessage.success(`竞拍成功！交易哈希: ${mockTxHash.slice(0, 10)}...`)
      bidAmount.value = minBid.value
    } else {
      await placeBid(auction.value.auctionId, bidAmount.value.toString())
      ElMessage.success('出价指令已发送，请等待区块确认')
      setTimeout(fetchAuctionDetail, 5000)
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
  ElMessage.info('拍卖已到达截止时间')
  fetchAuctionDetail()
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
      .title {
        font-size: 36px;
        font-weight: 800;
        color: #1a1a2e;
        margin-bottom: 12px;
        line-height: 1.2;
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
        gap: 15px;
        margin-bottom: 15px;

        .input-wrapper {
          position: relative;
          flex: 1;
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
            .el-input__inner {
              text-align: left;
              padding-left: 20px;
              font-weight: 700;
              font-size: 18px;
            }
          }
        }

        .bid-btn {
          height: 50px;
          padding: 0 40px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 12px;
        }
      }

      .min-bid-hint {
        font-size: 13px;
        color: #666;
        text-align: center;
        margin: 0;
        strong {
          color: #1a1a2e;
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