import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/LoginLanding.vue'),
    meta: { title: '登录', hideChrome: true }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/auctions',
    name: 'Auctions',
    component: () => import('@/views/Auctions.vue'),
    meta: { title: '拍卖列表' }
  },
  {
    path: '/auction/:id',
    name: 'AuctionDetail',
    component: () => import('@/views/AuctionDetail.vue'),
    meta: { title: '拍卖详情' }
  },
  {
    path: '/won-detail/:id',
    name: 'WonAuctionDetail',
    component: () => import('@/views/WonAuctionDetail.vue'),
    meta: { title: '竞拍成功详情', requiresAuth: true }
  },
  {
    path: '/lost-detail/:id',
    name: 'LostAuctionDetail',
    component: () => import('@/views/LostAuctionDetail.vue'),
    meta: { title: '竞拍失败详情', requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/ArtworkAudit.vue'),
        meta: { title: '作品审核' }
      },
      {
        path: 'auctions',
        name: 'AdminAuctions',
        component: () => import('@/views/admin/AuctionManager.vue'),
        meta: { title: '拍卖管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/AdminUsers.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  {
    path: '/create',
    name: 'CreateArtwork',
    component: () => import('@/views/CreateArtwork.vue'),
    meta: { title: '发布艺术品', requiresAuth: true }
  },
  {
    path: '/my-artworks',
    name: 'MyArtworks',
    component: () => import('@/views/MyArtworks.vue'),
    meta: { title: '我的作品', requiresAuth: true }
  },
  {
    path: '/my-bids',
    name: 'MyBids',
    component: () => import('@/views/MyBids.vue'),
    meta: { title: '我的竞拍', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '个人设置', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 设置页面标题
  document.title = `${String(to.meta.title) || 'ArtChain'} - 艺术品竞拍系统`

  const userStore = useUserStore()
  if (to.name === 'Home' && userStore.isConnected && userStore.role !== 'admin') {
    next({ name: 'Explore' })
    return
  }
  if (to.meta.requiresAdmin) {
    if (userStore.role !== 'admin') {
      next({ name: 'Home', query: { redirect: to.fullPath } })
      return
    }
  } else if (to.meta.requiresAuth) {
    if (!userStore.isConnected) {
      next({ name: 'Home', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
