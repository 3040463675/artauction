<template>
  <div class="my-bids-page">
    <div class="container">
      <div class="page-header">
        <div class="header-left">
          <h1>我的竞拍</h1>
          <p class="subtitle">追踪您参与的所有艺术品拍卖记录</p>
        </div>
      </div>

      <div class="filter-section">
        <el-tabs v-model="activeTab" class="bid-tabs">
          <el-tab-pane label="正在参与" name="active" />
          <el-tab-pane label="竞拍成功" name="won" />
          <el-tab-pane label="竞拍失败" name="lost" />
          <el-tab-pane label="全部记录" name="all" />
        </el-tabs>
      </div>

      <div v-loading="loading" class="bids-list">
        <template v-if="filteredBids.length > 0">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="8" v-for="bid in filteredBids" :key="bid.id">
              <el-card class="bid-card" shadow="hover" :body-style="{ padding: '0px' }">
                <div class="artwork-preview">
                  <el-image :src="bid.imageUrl" fit="cover" class="preview-img">
                    <template #error>
                      <div class="image-placeholder">
                        <el-icon :size="40"><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="status-tag" :class="bid.bidStatus">
                    {{ bidStatusMap[bid.bidStatus] }}
                  </div>
                  <el-button 
                    class="delete-btn" 
                    type="danger" 
                    :icon="Delete" 
                    circle 
                    size="small"
                    @click.stop="handleDelete(bid.id)"
                  />
                </div>
                <div class="bid-content">
                  <h3 class="artwork-title">{{ bid.title }}</h3>
                  <div class="bid-info-grid">
                    <div class="info-item">
                      <span class="label">当前价格</span>
                      <span class="value">{{ formatPrice(bid.currentPrice) }} ETH</span>
                    </div>
                    <div class="info-item">
                      <span class="label">我的出价</span>
                      <span class="value my-bid">{{ formatPrice(bid.myPrice) }} ETH</span>
                    </div>
                  </div>
                  <div class="time-info">
                    <el-icon><Timer /></el-icon>
                    <span>{{ formatTime(bid.endTime) }}</span>
                  </div>
                  <div class="card-footer">
                    <el-button type="primary" plain @click="viewDetail(bid.id)">查看详情</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>
        <el-empty v-else description="暂无竞拍记录">
          <el-button type="primary" @click="$router.push('/auctions')">去参与竞拍</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, Timer, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyBids } from '@/api/auction'
import { useUserStore } from '@/stores/user'
import type { Auction } from '@/types'
import { mockAuctions } from '@/utils/mockData'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('active')
const bids = ref<any[]>([]) // 扩展 Auction 带有 bidStatus

const bidStatusMap: Record<string, string> = {
  active: '进行中',
  won: '竞拍成功',
  lost: '竞拍失败'
}

const filteredBids = computed(() => {
  if (activeTab.value === 'all') return bids.value
  return bids.value.filter(item => item.bidStatus === activeTab.value)
})

const fetchMyBids = async () => {
  if (!userStore.address) return
  loading.value = true
  try {
    const res = await getMyBids(userStore.address)
    
    // 获取已删除的黑名单列表
    const deletedIds = JSON.parse(localStorage.getItem('MOCK_DELETED_BIDS') || '[]')
    
    if (res.data?.length > 0) {
      bids.value = res.data
        .filter(item => !deletedIds.includes(item.id) && !deletedIds.includes(item.auctionId))
        .map(item => ({
          ...item,
          myPrice: item.highestBid || item.startingPrice,
          bidStatus: item.status === 1 ? 'active' : (item.highestBidder === userStore.address ? 'won' : 'lost'),
          // 确保字段映射
          title: item.artwork?.name,
          imageUrl: item.artwork?.imageUrl,
          currentPrice: item.highestBid || item.startingPrice
        }))
    } else {
      const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
      const resultBids: any[] = []
      
      // 1. 先加载本地存储中的所有记录（排除已删除的）
      Object.keys(localMockBids).forEach(id => {
        if (deletedIds.includes(id)) return
        
        const saved = localMockBids[id]
        const mockInfo = mockAuctions.find(m => m.auctionId === id)
        
        resultBids.push({
          id: id,
          ...saved,
          title: mockInfo?.artwork.name || saved.title,
          imageUrl: mockInfo?.artwork.imageUrl || saved.imageUrl
        })
      })

      // 2. 如果本地记录太少，补充一些默认的模拟数据（也要排除已删除的）
      if (resultBids.length < 3) {
        mockAuctions.forEach((mock, index) => {
          if (resultBids.length >= 3) return // 最多补充到 3 条
          if (!localMockBids[mock.auctionId] && !deletedIds.includes(mock.auctionId)) {
            let defaultStatus = 'active'
            if (index === 1) defaultStatus = 'won'
            if (index === 2) defaultStatus = 'lost'
            
            resultBids.push({
              id: mock.auctionId,
              title: mock.artwork.name,
              imageUrl: mock.artwork.imageUrl,
              currentPrice: mock.highestBid,
              myPrice: (Number(mock.highestBid) - 0.2).toFixed(1),
              endTime: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
              bidStatus: defaultStatus
            })
          }
        })
      }
      
      bids.value = resultBids
    }
  } catch (error) {
    console.error('Failed to fetch my bids:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (time: string) => {
  if (!time) return '已结束'
  return new Date(time).toLocaleString()
}

import { formatPrice } from '@/utils/format'

const viewDetail = (id: string | number) => {
  router.push({ name: 'AuctionDetail', params: { id } })
}

const handleDelete = (id: string | number) => {
  ElMessageBox.confirm(
    '确认删除这条竞拍记录吗？删除后将无法恢复。',
    '警告',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 1. 从本地状态中移除
    bids.value = bids.value.filter(item => item.id !== id)
    
    // 2. 记录到“已删除名单”，防止刷新后重新出现
    const deletedIds = JSON.parse(localStorage.getItem('MOCK_DELETED_BIDS') || '[]')
    if (!deletedIds.includes(id)) {
      deletedIds.push(id)
      localStorage.setItem('MOCK_DELETED_BIDS', JSON.stringify(deletedIds))
    }
    
    // 3. 如果是模拟数据且在 localStorage 中，同步移除
    const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
    if (localMockBids[id]) {
      delete localMockBids[id]
      localStorage.setItem('MOCK_USER_BIDS', JSON.stringify(localMockBids))
    }
    
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

onMounted(() => {
  fetchMyBids()
})
</script>

<style lang="scss" scoped>
.my-bids-page {
  padding: 40px 0;
  min-height: calc(100vh - 64px - 72px);
  background: #f8fafc;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

.page-header {
  margin-bottom: 32px;
  h1 {
    margin: 0 0 8px 0;
    font-size: 32px;
    font-weight: 800;
    color: #1a1a2e;
  }
  .subtitle {
    margin: 0;
    color: #64748b;
    font-size: 16px;
  }
}

.filter-section {
  margin-bottom: 32px;
  
  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 600;
    color: #94a3b8;
    &.is-active {
      color: #3b82f6;
    }
  }
}

.bid-card {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    .artwork-preview .delete-btn {
      opacity: 1;
      transform: scale(1);
    }
  }

  .artwork-preview {
    position: relative;
    height: 160px;
    
    .preview-img {
      width: 100%;
      height: 100%;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
    }

    .status-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      backdrop-filter: blur(4px);

      &.active { background: rgba(59, 130, 246, 0.9); }
      &.won { background: rgba(34, 197, 94, 0.9); }
      &.lost { background: rgba(239, 68, 68, 0.9); }
    }

    .delete-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      opacity: 0;
      transition: all 0.3s;
      transform: scale(0.8);
      z-index: 10; // 确保在图片之上
    }
  }

  .bid-content {
    padding: 20px;

    .artwork-title {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .bid-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      .info-item {
        .label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          &.my-bid {
            color: #3b82f6;
          }
        }
      }
    }

    .time-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .card-footer {
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
