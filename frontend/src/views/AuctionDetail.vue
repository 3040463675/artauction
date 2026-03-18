<template>
  <div class="auction-detail-page" v-loading="loading">
    <div class="container" v-if="auction">
      <el-row :gutter="32">
        <!-- 左侧图片 -->
        <el-col :xs="24" :md="12">
          <div class="image-section">
            <el-image
              :src="auction.artwork?.imageUrl"
              fit="contain"
              class="main-image"
              :preview-src-list="[auction.artwork?.imageUrl]"
            />
          </div>
        </el-col>

        <!-- 右侧信息 -->
        <el-col :xs="24" :md="12">
          <div class="info-section">
            <h1 class="title">{{ auction.artwork?.name }}</h1>
            
            <div class="creator-info">
              <el-avatar :size="40" class="creator-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="creator-detail">
                <span class="label">创作者</span>
                <span class="name">{{ auction.artwork?.creator?.username || formatAddress(auction.sellerAddress) }}</span>
              </div>
            </div>

            <el-divider />

            <!-- 拍卖信息 -->
            <div class="auction-info">
              <div class="price-section">
                <div class="current-bid">
                  <span class="label">当前最高出价</span>
                  <div class="value">
                    <span class="amount">{{ auction.highestBid || '0' }}</span>
                    <span class="unit">ETH</span>
                  </div>
                </div>

                <div class="countdown" v-if="auction.status === 1">
                  <span class="label">剩余时间</span>
                  <CountdownTimer :endTime="auction.endTime" @end="handleAuctionEnd" />
                </div>
              </div>

              <div class="info-row">
                <span class="label">起拍价</span>
                <span class="value">{{ auction.startingPrice }} ETH</span>
              </div>
              <div class="info-row">
                <span class="label">最小加价</span>
                <span class="value">{{ auction.minIncrement }} ETH</span>
              </div>
              <div class="info-row">
                <span class="label">状态</span>
                <el-tag :type="getStatusType(auction.status)">
                  {{ getStatusText(auction.status) }}
                </el-tag>
              </div>
            </div>

            <!-- 出价区域 -->
            <div class="bid-section" v-if="auction.status === 1">
              <div class="bid-input">
                <el-input-number
                  v-model="bidAmount"
                  :min="minBid"
                  :step="Number(auction.minIncrement) || 0.01"
                  :precision="4"
                  size="large"
                />
                <span class="unit">ETH</span>
              </div>

              <el-button
                type="primary"
                size="large"
                class="bid-button"
                :loading="bidding"
                @click="handleBid"
              >
                立即出价
              </el-button>

              <p class="bid-hint">
                最低出价: {{ minBid }} ETH
              </p>
            </div>

            <!-- 结束拍卖按钮 -->
            <div class="end-section" v-if="canEndAuction">
              <el-button
                type="danger"
                size="large"
                :loading="ending"
                @click="handleEndAuction"
              >
                结束拍卖
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 出价历史 -->
      <div class="bid-history-section">
        <h2>出价历史</h2>
        <el-table :data="bidHistory" v-if="bidHistory.length > 0">
          <el-table-column label="出价者" width="200">
            <template #default="{ row }">
              {{ formatAddress(row.bidderAddress) }}
            </template>
          </el-table-column>
          <el-table-column label="出价金额" width="150">
            <template #default="{ row }">
              {{ row.amount }} ETH
            </template>
          </el-table-column>
          <el-table-column label="时间">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无出价记录" />
      </div>

      <!-- 艺术品描述 -->
      <div class="description-section">
        <h2>艺术品描述</h2>
        <p>{{ auction.artwork?.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { getAuctionInfo, getBidHistoryOnChain, placeBid, endAuction } from '@/utils/contracts'
import { getAuctionById, getBidHistory } from '@/api/auction'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const bidding = ref(false)
const ending = ref(false)
const auction = ref<any>(null)
const bidHistory = ref<any[]>([])
const bidAmount = ref(0)

const minBid = computed(() => {
  if (!auction.value) return 0
  const highest = Number(auction.value.highestBid) || 0
  const starting = Number(auction.value.startingPrice) || 0
  const increment = Number(auction.value.minIncrement) || 0.01
  
  if (highest > 0) {
    return highest + increment
  }
  return starting
})

const canEndAuction = computed(() => {
  if (!auction.value || !userStore.isConnected) return false
  const now = Date.now()
  return (
    auction.value.status === 1 &&
    now >= auction.value.endTime &&
    userStore.address === auction.value.sellerAddress
  )
})

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatTime = (time: string | number) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
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
    0: '待开始',
    1: '进行中',
    2: '已结束',
    3: '已取消',
    4: '已结算'
  }
  return texts[status] || '未知'
}

const fetchAuctionDetail = async () => {
  const id = route.params.id as string
  loading.value = true
  
  try {
    // 从后端获取详情
    const res = await getAuctionById(Number(id))
    auction.value = res.data
    
    // 获取出价历史
    const historyRes = await getBidHistory(Number(id))
    bidHistory.value = historyRes.data || []
    
    // 设置初始出价金额
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
      `确认出价 ${bidAmount.value} ETH？`,
      '确认出价',
      { type: 'info' }
    )

    bidding.value = true
    await placeBid(auction.value.auctionId, bidAmount.value.toString())
    
    ElMessage.success('出价成功！')
    await fetchAuctionDetail()
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
      '确认结束拍卖？结束后将自动完成结算。',
      '确认结束',
      { type: 'warning' }
    )

    ending.value = true
    await endAuction(auction.value.auctionId)
    
    ElMessage.success('拍卖已结束！')
    await fetchAuctionDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    ending.value = false
  }
}

const handleAuctionEnd = () => {
  ElMessage.info('拍卖已结束')
  fetchAuctionDetail()
}

onMounted(() => {
  fetchAuctionDetail()
})
</script>

<style lang="scss" scoped>
.auction-detail-page {
  padding: 24px 0;
  min-height: calc(100vh - 64px - 72px);

  .image-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    
    .main-image {
      width: 100%;
      max-height: 500px;
    }
  }

  .info-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;

    .title {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .creator-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .creator-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .creator-detail {
        .label {
          display: block;
          font-size: 12px;
          color: #999;
        }
        .name {
          font-weight: 500;
        }
      }
    }

    .auction-info {
      .price-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 20px;
        background: #f5f7fa;
        border-radius: 8px;

        .current-bid {
          .label {
            display: block;
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }
          .value {
            .amount {
              font-size: 28px;
              font-weight: 600;
              color: #1a1a2e;
            }
            .unit {
              font-size: 16px;
              color: #666;
              margin-left: 4px;
            }
          }
        }
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        .label {
          color: #666;
        }
        .value {
          font-weight: 500;
        }
      }
    }

    .bid-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;

      .bid-input {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .unit {
          font-size: 16px;
          color: #666;
        }
      }

      .bid-button {
        width: 100%;
      }

      .bid-hint {
        text-align: center;
        color: #999;
        font-size: 12px;
        margin-top: 12px;
      }
    }
  }

  .bid-history-section,
  .description-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;

    h2 {
      font-size: 20px;
      margin-bottom: 20px;
    }
  }
}
</style>
