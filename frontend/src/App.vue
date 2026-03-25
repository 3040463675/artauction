<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 顶部导航 - 在非管理后台且非隐藏Chrome页面显示 -->
      <header v-if="!$route.path.startsWith('/admin') && !$route.meta.hideChrome" class="app-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/explore')">
            <div class="logo-icon-wrapper">
              <svg viewBox="0 0 1024 1024" width="24" height="24">
                <path fill="currentColor" d="M832 160H192c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-608 80h136v136H224V240zm0 408h136v136H224V648zm408 136H496V648h136v128zm0-408H496V240h136v136zm240 408H736V648h136v136zm0-408H736V240h136v136zM360 496h304v32H360z"/>
                <path fill="currentColor" d="M360 416h304v32H360z" opacity=".8"/>
                <path fill="currentColor" d="M360 576h304v32H360z" opacity=".8"/>
              </svg>
            </div>
            <span class="logo-text">ArtChain</span>
          </div>
          
          <nav class="nav-menu">
            <router-link to="/explore" class="nav-item">首页</router-link>
            <router-link to="/auctions" class="nav-item">拍卖列表</router-link>
            <router-link to="/my-artworks" class="nav-item" v-if="userStore.isConnected">
              我的作品
            </router-link>
            <router-link to="/my-bids" class="nav-item" v-if="userStore.isConnected">
              我的竞拍
            </router-link>
          </nav>

          <div class="header-right">
            <!-- 钱包连接状态 -->
            <template v-if="userStore.isConnected">
              <el-tag type="success" class="wallet-tag">
                {{ formatAddress(userStore.address) }}
              </el-tag>
              <span class="balance">
                {{ formatPrice(userStore.balance) }} ETH
              </span>
              <el-button type="danger" size="small" @click="disconnectWallet">
                断开连接
              </el-button>
            </template>
            <template v-else>
              <el-button type="primary" @click="connectWallet">
                <el-icon><Wallet /></el-icon>
                连接钱包
              </el-button>
            </template>

            <!-- 用户菜单 -->
            <el-dropdown v-if="userStore.isConnected" trigger="click">
              <el-avatar 
                :size="36" 
                class="user-avatar"
                :src="userStore.userInfo?.avatar || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200'"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="logout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <!-- 主内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </main>

      <!-- 页脚 - 在非管理后台且非隐藏Chrome页面显示 -->
      <footer v-if="!$route.path.startsWith('/admin') && !$route.meta.hideChrome" class="app-footer">
        <p>&copy; 2024 ArtChain - 基于区块链的艺术品竞拍系统</p>
      </footer>

    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useUserStore } from '@/stores/user'
import { connectWallet as connect, disconnectWallet as disconnect } from '@/utils/wallet'
import { formatPrice } from '@/utils/format'

const userStore = useUserStore()
const router = useRouter()

// 格式化地址显示
const formatAddress = (address: any) => {
  if (!address) return ''
  // 如果传入的是对象且包含 address 属性，提取地址
  const addr = typeof address === 'object' ? address.address : address
  if (!addr || typeof addr !== 'string') return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// 连接钱包
const connectWallet = async () => {
  try {
    await connect()
    ElMessage.success('钱包连接成功')
  } catch (error: any) {
    ElMessage.error(error.message || '连接失败')
  }
}

// 断开钱包
const disconnectWallet = () => {
  disconnect()
  ElMessage.info('已断开连接')
}

// 退出登录
const logout = () => {
  disconnect()
  router.push({ name: 'Home' })
  ElMessage.info('已退出登录，返回登录页')
}

onMounted(async () => {
  // 检查是否已连接
  if (userStore.isConnected) {
    await userStore.refreshBalance()
  }
})
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    color: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.05);

      .logo-icon-wrapper {
        transform: rotate(15deg);
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
      }
    }

    .logo-icon-wrapper {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.4s ease;
      color: #fff;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff 30%, rgba(255, 255, 255, 0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: 'Inter', sans-serif;
    }
  }

  .nav-menu {
    display: flex;
    gap: 32px;

    .nav-item {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 15px;
      padding: 8px 0;
      position: relative;
      transition: color 0.3s;

      &:hover,
      &.router-link-active {
        color: #fff;
      }

      &.router-link-active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .wallet-tag {
      font-family: monospace;
    }

    .balance {
      color: #fff;
      font-size: 14px;
    }

    .user-avatar {
      cursor: pointer;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }
}

.app-main {
  flex: 1;
  background: #f5f7fa;
}

.app-footer {
  background: #1a1a2e;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 24px;
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
