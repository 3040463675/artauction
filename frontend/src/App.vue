<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 顶部导航 - 在非管理后台页面显示 -->
      <header v-if="!$route.path.startsWith('/admin')" class="app-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
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
                  <el-dropdown-item @click="handleSwitchRole">
                    切换身份 (当前: {{ roleName }})
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

      <!-- 页脚 - 在非管理后台页面显示 -->
      <footer v-if="!$route.path.startsWith('/admin')" class="app-footer">
        <p>&copy; 2024 ArtChain - 基于区块链的艺术品竞拍系统</p>
      </footer>

      <!-- 管理员认证弹窗 -->
      <el-dialog
        v-model="adminAuthVisible"
        title="管理员身份认证"
        width="400px"
        center
        append-to-body
        destroy-on-close
      >
        <el-form :model="adminForm" label-position="top">
          <el-form-item label="管理员 ID">
            <el-input v-model="adminForm.id" placeholder="请输入管理员ID" />
          </el-form-item>
          <el-form-item label="认证密码">
            <el-input 
              v-model="adminForm.password" 
              type="password" 
              placeholder="请输入认证密码" 
              show-password 
              @keyup.enter="submitAdminAuth"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="adminAuthVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAdminAuth" :loading="authLoading">
              认证并切换
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useUserStore } from '@/stores/user'
import { connectWallet as connect, disconnectWallet as disconnect } from '@/utils/wallet'
import { formatPrice } from '@/utils/format'

const userStore = useUserStore()
const router = useRouter()

// 管理员认证相关状态
const adminAuthVisible = ref(false)
const authLoading = ref(false)
const adminForm = reactive({
  id: '',
  password: ''
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

const handleSwitchRole = () => {
  ElMessageBox.prompt('请输入要切换的角色代码 (admin, seller, buyer, auction_house)', '切换身份', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: userStore.role,
    inputPattern: /^(admin|seller|buyer|auction_house)$/,
    inputErrorMessage: '角色代码无效'
  }).then(({ value }: any) => {
    // 如果切换到管理员，需要额外认证
    if (value === 'admin') {
      adminForm.id = ''
      adminForm.password = ''
      adminAuthVisible.value = true
      return
    }

    // 其他身份直接切换
    userStore.setRole(value)
    ElMessage.success(`已切换身份为: ${value === 'buyer' ? '竞买人' : value}`)
    
    // 如果当前在管理页面但切换到了非管理员身份，跳转回首页
    if (router.currentRoute.value.path.startsWith('/admin') && value !== 'admin') {
      router.push('/')
    } else {
      // 否则刷新当前页面以更新状态
      setTimeout(() => window.location.reload(), 100)
    }
  }).catch(() => {})
}

// 提交管理员认证
const submitAdminAuth = () => {
  if (authLoading.value) return

  if (!adminForm.id || !adminForm.password) {
    ElMessage.warning('请填写完整的认证信息')
    return
  }

  authLoading.value = true
  
  // 模拟后端认证逻辑
  setTimeout(() => {
    // 演示账号：ID 为 admin，密码为 admin888
    if (adminForm.id === 'admin' && adminForm.password === 'admin888') {
      userStore.setRole('admin')
      ElMessage.success({
        message: '管理员身份认证成功',
        duration: 2000,
        grouping: true
      })
      adminAuthVisible.value = false
      // 认证成功后直接跳转到管理后台首页
      router.push('/admin/dashboard')
    } else {
      ElMessage.error('管理员 ID 或密码错误')
    }
    authLoading.value = false
  }, 800)
}

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
