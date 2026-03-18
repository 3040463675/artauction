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
    auctions.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('Failed to fetch auctions:', error)
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
  router.push(`/auction/${auction.auctionId}`)
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
