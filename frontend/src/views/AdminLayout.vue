<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ 'is-collapsed': isCollapse }">
      <div class="sidebar-logo" @click="$router.push('/')">
        <div class="logo-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <span v-if="!isCollapse" class="logo-text">管理控制台</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="admin-menu"
        :collapse="isCollapse"
        background-color="#1a1a2e"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/artworks">
          <el-icon><Picture /></el-icon>
          <template #title>作品审核</template>
        </el-menu-item>

        <el-menu-item index="/admin/auctions">
          <el-icon><Timer /></el-icon>
          <template #title>拍卖监控</template>
        </el-menu-item>

        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer" @click="isCollapse = !isCollapse">
        <el-icon :class="{ 'rotate-180': isCollapse }">
          <Fold />
        </el-icon>
      </div>
    </aside>

    <!-- 主体内容 -->
    <main class="admin-main">
      <!-- 后台顶部 -->
      <header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">后台首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="admin-info">
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
                <el-dropdown-item @click="handleSwitchIdentity">切换身份</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容区域 -->
      <section class="admin-content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Monitor, 
  DataBoard, 
  User, 
  Picture, 
  Timer, 
  Setting, 
  Fold, 
  ArrowDown 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const handleSwitchIdentity = () => {
  userStore.setRole('buyer')
  ElMessage.success('已切换为竞买人身份')
  router.push('/')
}

const currentPageTitle = computed(() => {
  const map: any = {
    '/admin/dashboard': '数据概览',
    '/admin/users': '用户管理',
    '/admin/artworks': '作品审核',
    '/admin/auctions': '拍卖监控',
    '/admin/settings': '系统配置'
  }
  return map[route.path] || '管理后台'
})


</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

.admin-sidebar {
  width: 240px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  z-index: 100;

  &.is-collapsed {
    width: 64px;
  }

  .sidebar-logo {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.05);

    .logo-icon {
      width: 32px;
      height: 32px;
      background: #409eff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
    }

    .logo-text {
      color: #fff;
      font-weight: 800;
      font-size: 18px;
      white-space: nowrap;
    }
  }

  .admin-menu {
    flex: 1;
    border-right: none;
    padding-top: 10px;

    :deep(.el-menu-item) {
      height: 56px;
      margin: 4px 10px;
      border-radius: 8px;
      
      &:hover {
        background: rgba(255,255,255,0.05) !important;
      }
      
      &.is-active {
        background: #409eff !important;
        color: #fff !important;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }
    }
  }

  .sidebar-footer {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    border-top: 1px solid rgba(255,255,255,0.05);
    transition: color 0.3s;

    &:hover {
      color: #fff;
    }

    .rotate-180 {
      transform: rotate(180deg);
    }
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  z-index: 90;

  .admin-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.3s;

    &:hover {
      background: #f5f7fa;
    }

    .admin-avatar {
      background: #409eff;
      font-weight: 800;
    }

    .admin-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
  }
}

.admin-content-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
