<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/admin/dashboard')">
          <div class="logo-icon-wrapper">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path fill="currentColor" d="M832 160H192c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-608 80h136v136H224V240zm0 408h136v136H224V648zm408 136H496V648h136v128zm0-408H496V240h136v136zm240 408H736V648h136v136zm0-408H736V240h136v136zM360 496h304v32H360z"/>
              <path fill="currentColor" d="M360 416h304v32H360z" opacity=".8"/>
              <path fill="currentColor" d="M360 576h304v32H360z" opacity=".8"/>
            </svg>
          </div>
          <span class="logo-text">ArtChain Admin</span>
        </div>
        
        <nav class="admin-nav">
          <router-link to="/admin/dashboard" class="nav-item">
            <el-icon><DataLine /></el-icon>数据概览
          </router-link>
          <router-link to="/admin/audit" class="nav-item">
            <el-icon><Check /></el-icon>作品审核
          </router-link>
          <router-link to="/admin/auctions" class="nav-item">
            <el-icon><Monitor /></el-icon>拍卖管理
          </router-link>
        </nav>

        <div class="admin-user">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar 
                :size="32" 
                class="admin-avatar"
                src="https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=100"
              />
              <span class="admin-name">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出管理</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <div class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { 
  DataLine, 
  Check, 
  Monitor, 
  ArrowDown 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  userStore.setRole('buyer')

  if (!userStore.address) {
    ElMessage.warning('已退出管理员模式，请先连接钱包完成竞买人认证')
    router.push('/')
    return
  }

  await userStore.refreshBalance()
  ElMessage.success({
    message: '竞买人身份认证成功',
    duration: 2000,
    grouping: true
  })
  router.push('/')
}
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: #1a1a2e;
  color: #fff;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    .logo-icon-wrapper {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 30%, rgba(255, 255, 255, 0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .admin-nav {
    display: flex;
    gap: 32px;
    margin: 0 40px;

    .nav-item {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 0;
      position: relative;
      transition: all 0.3s;

      .el-icon {
        font-size: 18px;
      }

      &:hover,
      &.router-link-active {
        color: #fff;
      }

      &.router-link-active::after {
        content: '';
        position: absolute;
        bottom: -18px;
        left: 0;
        right: 0;
        height: 3px;
        background: #409eff;
        border-radius: 2px;
      }
    }
  }

  .admin-user {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #fff;
      
      .admin-name {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

.admin-main {
  flex: 1;
  padding: 24px 0;
  
  .admin-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
