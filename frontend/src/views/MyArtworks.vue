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
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="auctioning">拍卖中</el-radio-button>
          <el-radio-button value="ended">已结束</el-radio-button>
        </el-radio-group>
      </div>

      <div v-loading="loading" class="artworks-grid">
        <template v-if="filteredArtworks.length > 0">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in filteredArtworks" :key="item.id">
              <div class="artwork-card-wrapper">
                <AuctionCard 
                  :auction="item" 
                  :show-countdown="item.status === 1" 
                  @click="viewDetail(item)"
                />
                <div class="card-actions">
                  <el-button 
                    type="danger" 
                    :icon="Delete" 
                    circle 
                    size="small"
                    @click.stop="handleDelete(item)"
                    title="删除作品"
                  />
                </div>
              </div>
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
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyAuctions } from '@/api/auction'
import { deleteArtwork } from '@/api/artwork'
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
    // 100% 数据库同步：仅使用后端 API 返回的数据
    artworks.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch my artworks:', error)
    artworks.value = []
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

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这件艺术品吗？删除后不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const id = item.id
    
    // 调用后端删除
    await deleteArtwork(id)

    // 刷新列表
    ElMessage.success('作品已删除')
    fetchMyArtworks()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
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

  .artwork-card-wrapper {
    position: relative;
    margin-bottom: 24px;

    .card-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      .card-actions {
        opacity: 1;
      }
    }
  }
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
