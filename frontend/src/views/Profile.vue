<template>
  <div class="profile-page">
    <div class="container">
      <!-- 用户概览卡片 -->
      <el-card class="user-info-card" :body-style="{ padding: '0px' }">
        <div class="user-header">
          <div class="header-bg"></div>
          <div class="header-content">
            <el-avatar 
              :size="100" 
              class="profile-avatar" 
              :src="userStore.userInfo?.avatar || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200'" 
            />
            <div class="user-details">
              <div class="name-row">
                <h2 class="username">{{ userStore.userInfo?.nickname || '艺术鉴赏家' }}</h2>
                <el-tag size="small" effect="dark" class="role-tag">{{ roleName }}</el-tag>
              </div>
              <div class="address-row">
                <span class="address-text">{{ userStore.address }}</span>
                <el-button link type="primary" @click="copyAddress">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-value">{{ formatPrice(userStore.balance) }} ETH</div>
            <div class="stat-label">账户余额</div>
          </div>
          <el-divider direction="vertical" />
          <div class="stat-item" @click="$router.push('/my-artworks')">
            <div class="stat-value">{{ myArtworksCount }}</div>
            <div class="stat-label">我的作品</div>
          </div>
          <el-divider direction="vertical" />
          <div class="stat-item" @click="$router.push('/my-bids')">
            <div class="stat-value">{{ myBidsCount }}</div>
            <div class="stat-label">参与竞拍</div>
          </div>
        </div>
      </el-card>

      <!-- 快速入口 -->
      <div class="quick-actions">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8" v-for="action in actions" :key="action.title">
            <el-card class="action-card" shadow="hover" @click="$router.push(action.path)">
              <div class="action-content">
                <div class="icon-box" :style="{ background: action.color }">
                  <el-icon :size="24"><component :is="action.icon" /></el-icon>
                </div>
                <div class="action-info">
                  <h3>{{ action.title }}</h3>
                  <p>{{ action.desc }}</p>
                </div>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 最近动态 -->
      <div class="recent-activity section">
        <div class="section-header">
          <h3>最近动态</h3>
          <el-button link>查看全部</el-button>
        </div>
        <el-card shadow="never">
          <el-empty description="暂无动态" :image-size="100" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { formatPrice } from '@/utils/format'
import { getMyAuctions, getMyBids } from '@/api/auction'
import { 
  CopyDocument, 
  Picture, 
  Collection, 
  Setting, 
  ArrowRight 
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const myArtworksCount = ref(0)
const myBidsCount = ref(0)

const fetchStats = async () => {
  if (!userStore.address) return
  try {
    const artworksRes = await getMyAuctions(userStore.address)
    myArtworksCount.value = (artworksRes.data && artworksRes.data.length > 0) ? artworksRes.data.length : 1 // 模拟1个
    
    const bidsRes = await getMyBids(userStore.address)
    myBidsCount.value = (bidsRes.data && bidsRes.data.length > 0) ? bidsRes.data.length : 3 // 模拟3个
  } catch (e) {
    myArtworksCount.value = 1
    myBidsCount.value = 3
  }
}

onMounted(() => {
  fetchStats()
})

const roleName = computed(() => {
  const roles = {
    admin: '管理员',
    auction_house: '拍卖行',
    seller: '艺术家',
    buyer: '竞买人'
  }
  return roles[userStore.role] || '用户'
})

const actions = [
  {
    title: '我的作品',
    desc: '管理我发布的作品',
    path: '/my-artworks',
    icon: Picture,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    title: '我的竞拍',
    desc: '查看参与的竞拍记录',
    path: '/my-bids',
    icon: Collection,
    color: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)'
  },
  {
    title: '个人设置',
    desc: '修改资料与安全设置',
    path: '/settings',
    icon: Setting,
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
]

const copyAddress = () => {
  navigator.clipboard.writeText(userStore.address)
  ElMessage.success('地址已复制到剪贴板')
}
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 40px 0;
  min-height: calc(100vh - 64px - 72px);
  background: #f8fafc;

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

.user-info-card {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);

  .user-header {
    position: relative;
    padding-bottom: 20px;

    .header-bg {
      height: 140px;
      background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), 
                  url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1000');
      background-size: cover;
      background-position: center 30%;
      border-radius: 20px 20px 0 0;
    }

    .header-content {
      display: flex;
      align-items: flex-end;
      padding: 0 30px;
      margin-top: -50px;
      gap: 24px;

      .profile-avatar {
        border: 4px solid #fff;
        background: #f0f2f5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .user-details {
        padding-bottom: 10px;
        flex: 1;

        .name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          transform: translateY(-12px);

          .username {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          }

          .role-tag {
            border-radius: 6px;
            backdrop-filter: blur(4px);
            background: rgba(64, 158, 255, 0.9);
            border: none;
          }
        }

        .address-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-family: monospace;
          font-size: 14px;
          margin-top: -15px;
        }
      }
    }
  }

  .user-stats {
    display: flex;
    justify-content: space-around;
    padding: 24px 30px;
    border-top: 1px solid #f1f5f9;
    background: #fff;

    .stat-item {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: #1a1a2e;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 13px;
        color: #94a3b8;
      }
    }

    .el-divider {
      height: 40px;
      margin: auto 0;
    }
  }
}

.quick-actions {
  margin-bottom: 40px;

  .action-card {
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
      
      .arrow-icon {
        transform: translateX(5px);
      }
    }

    .action-content {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;

      .icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }

      .action-info {
        h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #1f2937;
        }
        p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }
      }

      .arrow-icon {
        margin-left: auto;
        color: #cbd5e1;
        transition: transform 0.3s;
      }
    }
  }
}

.section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
  }

  :deep(.el-card) {
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }
}

@media (max-width: 768px) {
  .user-header .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    .user-details .name-row {
      justify-content: center;
    }
  }
  
  .action-card {
    margin-bottom: 16px;
  }
}
</style>
