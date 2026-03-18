<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 顶部导航 -->
      <header class="app-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <el-icon :size="32"><Picture /></el-icon>
            <span class="logo-text">ArtChain</span>
          </div>
          
          <nav class="nav-menu">
            <router-link to="/" class="nav-item">首页</router-link>
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
                {{ userStore.balance }} ETH
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
              <el-avatar :size="36" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/settings')">
                    设置
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
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- 页脚 -->
      <footer class="app-footer">
        <p>&copy; 2024 ArtChain - 基于区块链的艺术品竞拍系统</p>
      </footer>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useUserStore } from '@/stores/user'
import { connectWallet as connect, disconnectWallet as disconnect } from '@/utils/wallet'

const userStore = useUserStore()

// 格式化地址显示
const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
  ElMessage.info('已退出登录')
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
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
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
