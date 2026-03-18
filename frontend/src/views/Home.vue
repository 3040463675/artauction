<template>
  <div class="home-page">
    <!-- Hero区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
         
          <span class="text-gradient">艺术品拍卖平台</span>
        </h1>
        <p class="hero-subtitle">
          安全、透明、去中心化的艺术品交易体验
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/auctions')">
            浏览拍卖
          </el-button>
          <el-button size="large" @click="handleCreate" v-if="userStore.isConnected">
            发布作品
          </el-button>
        </div>
      </div>
    </section>

    <!-- 统计数据 -->
    <section class="stats-section">
      <div class="container">
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalArtworks }}</div>
              <div class="stat-label">艺术品</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalAuctions }}</div>
              <div class="stat-label">拍卖活动</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">用户</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalVolume }} ETH</div>
              <div class="stat-label">交易额</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>

    <!-- 热门拍卖 -->
    <section class="auctions-section">
      <div class="container">
        <div class="section-header">
          <h2>热门拍卖</h2>
          <el-button text @click="$router.push('/auctions')">
            查看更多 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <el-row :gutter="24" v-loading="loading">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="auction in hotAuctions" :key="auction.auctionId">
            <AuctionCard :auction="auction" @click="goToDetail(auction)" />
          </el-col>
        </el-row>

        <el-empty v-if="!loading && hotAuctions.length === 0" description="暂无拍卖活动" />
      </div>
    </section>

    <!-- 即将结束 -->
    <section class="auctions-section ending-soon">
      <div class="container">
        <div class="section-header">
          <h2>即将结束</h2>
          <el-tag type="danger">限时</el-tag>
        </div>

        <el-row :gutter="24" v-loading="loadingEnding">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="auction in endingSoonAuctions" :key="auction.auctionId">
            <AuctionCard :auction="auction" :showCountdown="true" @click="goToDetail(auction)" />
          </el-col>
        </el-row>
      </div>
    </section>

    <!-- 平台特点 -->
    <section class="features-section">
      <div class="container">
        <h2>为什么选择我们</h2>
        <el-row :gutter="24">
          <el-col :span="8">
            <div class="feature-card">
              <el-icon :size="48" class="feature-icon"><Lock /></el-icon>
              <h3>安全可靠</h3>
              <p>基于以太坊智能合约，资产安全有保障</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="feature-card">
              <el-icon :size="48" class="feature-icon"><View /></el-icon>
              <h3>公开透明</h3>
              <p>所有交易记录上链，可追溯可验证</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="feature-card">
              <el-icon :size="48" class="feature-icon"><Lightning /></el-icon>
              <h3>自动结算</h3>
              <p>智能合约自动执行，无需第三方介入</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getHotAuctions, getEndingSoonAuctions } from '@/api/auction'
import AuctionCard from '@/components/AuctionCard.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loadingEnding = ref(false)
const hotAuctions = ref<any[]>([])
const endingSoonAuctions = ref<any[]>([])

const stats = ref({
  totalArtworks: 128,
  totalAuctions: 56,
  totalUsers: 1024,
  totalVolume: '1,234.5'
})

const fetchHotAuctions = async () => {
  loading.value = true
  try {
    const res = await getHotAuctions()
    hotAuctions.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch hot auctions:', error)
  } finally {
    loading.value = false
  }
}

const fetchEndingSoonAuctions = async () => {
  loadingEnding.value = true
  try {
    const res = await getEndingSoonAuctions()
    endingSoonAuctions.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch ending soon auctions:', error)
  } finally {
    loadingEnding.value = false
  }
}

const goToDetail = (auction: any) => {
  router.push(`/auction/${auction.auctionId}`)
}

const handleCreate = () => {
  router.push('/create')
}

onMounted(() => {
  fetchHotAuctions()
  fetchEndingSoonAuctions()
})
</script>

<style lang="scss" scoped>
.home-page {
  .hero-section {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 100px 24px;
    text-align: center;

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-title {
      font-size: 48px;
      color: #fff;
      margin-bottom: 24px;
      line-height: 1.3;

      @media (max-width: 768px) {
        font-size: 32px;
      }
    }

    .hero-subtitle {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 40px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
  }

  .stats-section {
    background: #fff;
    padding: 48px 0;
    margin-top: -48px;
    position: relative;
    z-index: 10;

    .stat-card {
      text-align: center;
      padding: 24px;

      .stat-value {
        font-size: 36px;
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 8px;
      }

      .stat-label {
        color: #666;
        font-size: 16px;
      }
    }
  }

  .auctions-section {
    padding: 60px 0;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;

      h2 {
        font-size: 28px;
        font-weight: 600;
        color: #1a1a2e;
      }
    }

    &.ending-soon {
      background: #fff;
    }
  }

  .features-section {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
    padding: 80px 0;

    h2 {
      text-align: center;
      font-size: 32px;
      margin-bottom: 48px;
      color: #1a1a2e;
    }

    .feature-card {
      text-align: center;
      padding: 40px 24px;
      background: #fff;
      border-radius: 12px;
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-8px);
      }

      .feature-icon {
        color: #667eea;
        margin-bottom: 24px;
      }

      h3 {
        font-size: 20px;
        margin-bottom: 12px;
        color: #1a1a2e;
      }

      p {
        color: #666;
        line-height: 1.6;
      }
    }
  }
}
</style>
