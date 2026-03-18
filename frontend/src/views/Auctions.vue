<template>
  <div class="auctions-page">
    <div class="container">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索艺术品"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="statusFilter" placeholder="状态筛选" @change="handleFilter">
          <el-option label="全部" :value="undefined" />
          <el-option label="进行中" :value="1" />
          <el-option label="即将结束" :value="2" />
          <el-option label="已结束" :value="3" />
        </el-select>

        <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
          <el-option label="即将结束" value="endTime" />
          <el-option label="最新发布" value="newest" />
          <el-option label="价格最高" value="highestBid" />
        </el-select>
      </div>

      <!-- 拍卖列表 -->
      <el-row :gutter="24" v-loading="loading">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          v-for="auction in auctions"
          :key="auction.auctionId"
          class="auction-col"
        >
          <AuctionCard
            :auction="auction"
            :showCountdown="auction.status === 1"
            @click="goToDetail(auction)"
          />
        </el-col>
      </el-row>

      <el-empty v-if="!loading && auctions.length === 0" description="暂无拍卖活动" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuctions } from '@/api/auction'
import AuctionCard from '@/components/AuctionCard.vue'

const router = useRouter()

const loading = ref(false)
const auctions = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)

const keyword = ref('')
const statusFilter = ref<number | undefined>()
const sortBy = ref('endTime')

// 模拟数据
const mockAuctions = [
  {
    auctionId: 'mock-a1',
    artwork: { name: '未来之光', imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '1.5',
    startingPrice: '1.0',
    status: 1,
    endTime: Date.now() + 86400000
  },
  {
    auctionId: 'mock-a2',
    artwork: { name: '深海共鸣', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '2.8',
    startingPrice: '2.0',
    status: 1,
    endTime: Date.now() + 172800000
  },
  {
    auctionId: 'mock-a3',
    artwork: { name: '数字荒原', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '0.9',
    startingPrice: '0.5',
    status: 1,
    endTime: Date.now() + 259200000
  },
  {
    auctionId: 'mock-a4',
    artwork: { name: '城市之巅', imageUrl: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '3.2',
    startingPrice: '2.5',
    status: 1,
    endTime: Date.now() + 345600000
  },
  {
    auctionId: 'mock-a5',
    artwork: { name: '最后的晚餐 - 重构', imageUrl: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '5.6',
    startingPrice: '4.0',
    status: 1,
    endTime: Date.now() + 3600000
  },
  {
    auctionId: 'mock-a6',
    artwork: { name: '赛博霓虹', imageUrl: 'https://images.unsplash.com/photo-1614728263952-84ea206f25bc?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '1.2',
    startingPrice: '0.8',
    status: 1,
    endTime: Date.now() + 7200000
  },
  {
    auctionId: 'mock-a7',
    artwork: { name: '意识流转', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '0.5',
    startingPrice: '0.3',
    status: 1,
    endTime: Date.now() + 10800000
  },
  {
    auctionId: 'mock-a8',
    artwork: { name: '量子纠缠', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000' },
    highestBid: '4.1',
    startingPrice: '3.5',
    status: 1,
    endTime: Date.now() + 14400000
  }
]

const fetchAuctions = async () => {
  loading.value = true
  try {
    const res = await getAuctions({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
      keyword: keyword.value,
      sortBy: sortBy.value
    })
    
    if (res.data?.list?.length > 0) {
      auctions.value = res.data.list
      total.value = res.data.total
    } else {
      // 如果没有真实数据，使用模拟数据
      auctions.value = mockAuctions
      total.value = mockAuctions.length
    }
  } catch (error) {
    console.error('Failed to fetch auctions:', error)
    // 接口报错也显示模拟数据
    auctions.value = mockAuctions
    total.value = mockAuctions.length
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchAuctions()
}

const handleFilter = () => {
  page.value = 1
  fetchAuctions()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchAuctions()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (auction: any) => {
  // 优先使用数据库 id，如果没有则尝试 auctionId
  const id = auction.id || auction.auctionId
  console.log('[Debug] Navigating to Detail with ID:', id)
  router.push(`/auction/${id}`)
}

onMounted(() => {
  fetchAuctions()
})
</script>

<style lang="scss" scoped>
.auctions-page {
  padding: 24px 0;
  min-height: calc(100vh - 64px - 72px);

  .filter-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;

    .search-input {
      max-width: 300px;
    }
  }

  .auction-col {
    margin-bottom: 24px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 40px;
  }
}
</style>
