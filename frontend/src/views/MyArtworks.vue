<template>
  <div class="my-artworks-page">
    <div class="container">
      <div class="page-header">
        <div class="header-left">
          <h1>我的作品</h1>
          <p class="subtitle">管理您发布在 ArtChain 上的艺术资产</p>
        </div>
        <el-button type="primary" size="large" @click="goToCreate">
          <el-icon class="el-icon--left"><Plus /></el-icon>
          发布新作品
        </el-button>
      </div>

      <div class="filter-section">
        <el-radio-group v-model="statusFilter" size="large">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="auctioning">拍卖中</el-radio-button>
          <el-radio-button label="ended">已结束</el-radio-button>
        </el-radio-group>
      </div>

      <div v-loading="loading" class="artworks-grid">
        <template v-if="filteredArtworks.length > 0">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in filteredArtworks" :key="item.id">
              <AuctionCard 
                :auction="item" 
                :show-countdown="item.status === 1" 
                @click="viewDetail(item)"
              />
            </el-col>
          </el-row>
        </template>
        <el-empty v-else description="暂无作品">
          <el-button type="primary" @click="goToCreate">发布您的第一件艺术品</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { getMyAuctions } from '@/api/auction'
import { useUserStore } from '@/stores/user'
import type { Auction } from '@/types'
import { mockAuctions } from '@/utils/mockData'
import AuctionCard from '@/components/AuctionCard.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const artworks = ref<Auction[]>([])
const statusFilter = ref('all')

const filteredArtworks = computed(() => {
  if (statusFilter.value === 'all') return artworks.value
  const statusMap: Record<string, number> = {
    'auctioning': 1,
    'ended': 4 // 4 代表已结算/已完成
  }
  return artworks.value.filter(item => {
    if (statusFilter.value === 'ended') {
      return item.status === 4 || item.status === 2 || item.status === 3
    }
    return item.status === statusMap[statusFilter.value]
  })
})

const fetchMyArtworks = async () => {
  if (!userStore.address) return
  loading.value = true
  try {
    const res = await getMyAuctions(userStore.address)
    // 1. 获取本地发布的作品（通过 localStorage）
    const localCreated = JSON.parse(localStorage.getItem('MOCK_CREATED_AUCTIONS') || '[]')
    
    // 2. 获取接口返回的作品
    const rawListFromApi = res.data || []
    
    // 3. 合并列表
    artworks.value = [...localCreated, ...rawListFromApi]

    // 4. 如果合并后还是空的，显示一个默认的 mock 数据（可选，为了演示效果）
    if (artworks.value.length === 0) {
      const mock = mockAuctions[0]
      artworks.value = [
        {
          ...mock,
          id: 1,
          sellerAddress: userStore.address,
        }
      ] as any
    }
  } catch (error) {
    console.error('Failed to fetch my artworks:', error)
    // 报错时尝试显示本地数据
    const localCreated = JSON.parse(localStorage.getItem('MOCK_CREATED_AUCTIONS') || '[]')
    artworks.value = localCreated
  } finally {
    loading.value = false
  }
}

const goToCreate = () => {
  router.push({ name: 'CreateArtwork' })
}

const viewDetail = (item: Auction) => {
  // 优先跳转到 auctionId (例如 'mock-a1')，如果没有则用数字 id
  const targetId = item.auctionId || item.id
  router.push({ name: 'AuctionDetail', params: { id: targetId } })
}

onMounted(() => {
  fetchMyArtworks()
})
</script>

<style lang="scss" scoped>
.my-artworks-page {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  .header-left {
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
}

.filter-section {
  margin-bottom: 32px;
}

.artworks-grid {
  min-height: 400px;
}

.artwork-card {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .image-wrapper {
    position: relative;
    height: 200px;
    overflow: hidden;

    .artwork-image {
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

    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      backdrop-filter: blur(4px);

      &.auctioning {
        background: rgba(34, 197, 94, 0.9);
      }
      &.ended {
        background: rgba(100, 116, 139, 0.9);
      }
    }
  }

  .card-content {
    padding: 20px;

    .title {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price-info {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;

      .label {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 4px;
      }

      .price {
        font-size: 20px;
        font-weight: 800;
        color: #3b82f6;
      }
    }

    .card-footer {
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
