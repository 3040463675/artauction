<template>
  <div class="home-page">
    <!-- Hero区域 (轮播图) -->
    <section class="hero-carousel-section">
      <el-carousel trigger="click" height="600px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(item, index) in carouselItems" :key="index">
          <div class="carousel-item-bg" :style="{ backgroundImage: `url(${item.image})` }">
            <div class="overlay"></div>
            <div class="carousel-content">
              <h1 class="hero-title">{{ item.title }}</h1>
              <p class="hero-subtitle">{{ item.subtitle }}</p>
              <div class="hero-actions">
                <el-button type="primary" size="large" @click="$router.push('/auctions')">
                  浏览拍卖
                </el-button>
                <el-button size="large" @click="handleCreate" v-if="userStore.isConnected">
                  发布作品
                </el-button>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
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
              <div class="stat-value">{{ formatPrice(stats.totalVolume) }} ETH</div>
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
            <AuctionCard :auction="auction" :show-countdown="true" @click="goToDetail(auction)" />
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
import { mockAuctions } from '@/utils/mockData'
import { formatPrice } from '@/utils/format'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loadingEnding = ref(false)
const hotAuctions = ref<any[]>([])
const endingSoonAuctions = ref<any[]>([])

const carouselItems = [
  {
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=2058',
    title: '探索数字艺术的无限可能',
    subtitle: '全球首创的去中心化艺术品拍卖平台',
  },
  {
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000',
    title: '安全、透明、可信赖',
    subtitle: '基于以太坊智能合约，保障您的每一笔交易',
  },
  {
    image: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&q=80&w=2000',
    title: '发掘下一个艺术新星',
    subtitle: '汇集全球优质艺术创作者与收藏家',
  }
]

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
    hotAuctions.value = res.data?.length > 0 ? res.data : mockAuctions.slice(0, 4)
  } catch (error) {
    console.error('Failed to fetch hot auctions:', error)
    hotAuctions.value = mockAuctions.slice(0, 4)
  } finally {
    loading.value = false
  }
}

const fetchEndingSoonAuctions = async () => {
  loadingEnding.value = true
  try {
    const res = await getEndingSoonAuctions()
    endingSoonAuctions.value = res.data?.length > 0 ? res.data : mockAuctions.slice(4, 8)
  } catch (error) {
    console.error('Failed to fetch ending soon auctions:', error)
    endingSoonAuctions.value = mockAuctions.slice(4, 8)
  } finally {
    loadingEnding.value = false
  }
}

const goToDetail = (auction: any) => {
  const id = auction.id || auction.auctionId
  router.push(`/auction/${id}`)
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
  .hero-carousel-section {
    position: relative;
    overflow: hidden;

    :deep(.el-carousel__container) {
      height: 600px;
    }

    :deep(.el-carousel__indicators--horizontal) {
      bottom: 40px;
    }

    .carousel-item-bg {
      height: 100%;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(26, 26, 46, 0.3) 0%, rgba(26, 26, 46, 0.7) 100%);
        z-index: 1;
      }

      .carousel-content {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 900px;
        padding: 0 40px;
        color: #fff;

        .hero-title {
          font-size: 64px;
          font-weight: 700;
          margin-bottom: 24px;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          letter-spacing: 2px;
          color: #fff;

          @media (max-width: 768px) {
            font-size: 36px;
          }
        }

        .hero-subtitle {
          font-size: 24px;
          margin-bottom: 40px;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

          @media (max-width: 768px) {
            font-size: 18px;
          }
        }

        .hero-actions {
          display: flex;
          gap: 24px;
          justify-content: center;

          :deep(.el-button--large) {
            padding: 12px 40px;
            font-size: 18px;
            height: auto;
            border-radius: 30px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            
            &.el-button--primary {
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border: none;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

              &:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
              }
            }

            &:not(.el-button--primary) {
              background: rgba(255, 255, 255, 0.1);
              border: 2px solid rgba(255, 255, 255, 0.5);
              color: #fff;
              backdrop-filter: blur(10px);

              &:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #fff;
                transform: translateY(-3px);
              }
            }
          }
        }
      }
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
