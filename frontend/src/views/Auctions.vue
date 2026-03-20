<template>
  <div class="auctions-page">
    <div class="container">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索作品名称、ID或描述"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="statusFilter" placeholder="状态筛选" @change="handleFilter">
          <el-option label="全部" value="all" />
          <el-option label="进行中" :value="1" />
          <el-option label="即将结束 (1小时内)" value="endingSoon" />
          <el-option label="最新发布 (1小时内)" value="newlyAdded" />
          <el-option label="已结束" :value="4" />
        </el-select>

        <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
          <el-option label="默认排序" value="default" />
          <el-option label="价格: 从高到低" value="priceDesc" />
          <el-option label="价格: 从低到高" value="priceAsc" />
          <el-option label="时间: 即将结束" value="endTime" />
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAuctions } from '@/api/auction'
import AuctionCard from '@/components/AuctionCard.vue'
import { mockAuctions } from '@/utils/mockData'

const router = useRouter()

const loading = ref(false)
const auctions = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)

const keyword = ref('')
const statusFilter = ref<number | string>('all')
const sortBy = ref('endTime')

// 防抖搜索
let searchTimer: any = null
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 500)
})

const fetchAuctions = async () => {
  loading.value = true
  try {
    // 基础参数处理
    const isSpecialFilter = ['endingSoon', 'newlyAdded'].includes(statusFilter.value as string)
    const isEndedFilter = statusFilter.value === 4

    const res = await getAuctions({
      page: 1, 
      pageSize: 1000, 
      status: (isSpecialFilter || isEndedFilter || statusFilter.value === 'all') ? undefined : statusFilter.value as number,
      keyword: keyword.value,
      sortBy: sortBy.value === 'default' ? 'newest' : sortBy.value
    })
    
    // 1. 获取后端 API 数据
    const apiList = res.data?.list || []
    
    // 2. 准备 Mock 数据（进行前端模糊搜索）
    let filteredMock = []
    const searchKey = keyword.value.trim().toLowerCase()
    if (searchKey) {
      filteredMock = mockAuctions.filter(item => {
        const nameMatch = item.artwork?.name?.toLowerCase().includes(searchKey)
        const idMatch = item.auctionId?.toString().toLowerCase().includes(searchKey)
        const descMatch = item.artwork?.description?.toLowerCase().includes(searchKey)
        return nameMatch || idMatch || descMatch
      })
    } else {
      filteredMock = [...mockAuctions]
    }

    // 3. 合并数据并去重
    const seenIds = new Set(apiList.map((a: any) => a.auctionId?.toString()))
    const uniqueMock = filteredMock.filter(m => !seenIds.has(m.auctionId?.toString()))
    let combinedRawList = [...apiList, ...uniqueMock]

    // 4. 同步本地模拟竞拍成功的状态
    const localMockBids = JSON.parse(localStorage.getItem('MOCK_USER_BIDS') || '{}')
    let synchronizedList = combinedRawList.map(item => {
      const bidId = item.auctionId || item.id
      const bidInfo = localMockBids[bidId]
      
      if (bidInfo) {
        return { ...item, status: 4 }
      }
      
      // 测试模式：未成交的设为进行中，并确保有 createdAt
      return {
        ...item,
        status: item.status === 4 ? 4 : 1,
        createdAt: item.createdAt || (Date.now() - 3600000), // 默认1小时前发布
        endTime: item.endTime && new Date(item.endTime).getTime() > Date.now() 
          ? item.endTime 
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    })

    // 5. 应用增强的状态过滤逻辑
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (statusFilter.value === 'endingSoon') {
      // 即将结束：状态为1且剩余时间小于1小时
      synchronizedList = synchronizedList.filter(a => {
        const remaining = new Date(a.endTime).getTime() - now
        return a.status === 1 && remaining > 0 && remaining <= oneHour
      })
    } else if (statusFilter.value === 'newlyAdded') {
      // 最新发布：发布时间在1小时内
      synchronizedList = synchronizedList.filter(a => {
        const age = now - new Date(a.createdAt).getTime()
        return age >= 0 && age <= oneHour
      })
    } else if (statusFilter.value !== 'all') {
      synchronizedList = synchronizedList.filter(a => a.status === statusFilter.value)
    }

    // 6. 应用排序逻辑
    if (sortBy.value === 'priceDesc') {
      synchronizedList.sort((a, b) => Number(b.highestBid || b.startingPrice) - Number(a.highestBid || a.startingPrice))
    } else if (sortBy.value === 'priceAsc') {
      synchronizedList.sort((a, b) => Number(a.highestBid || a.startingPrice) - Number(b.highestBid || b.startingPrice))
    } else if (sortBy.value === 'endTime') {
      synchronizedList.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
    } else {
      // 默认/最新发布
      synchronizedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    
    // 7. 更新总数与分页
    total.value = synchronizedList.length
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    auctions.value = synchronizedList.slice(start, end)
  } catch (error) {
    console.error('Failed to fetch auctions:', error)
    auctions.value = [...mockAuctions]
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
