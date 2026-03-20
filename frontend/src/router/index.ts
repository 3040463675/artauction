import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
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
    meta: { title: '设置', requiresAuth: true }
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

// 路由守卫
router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 设置页面标题
  document.title = `${String(to.meta.title) || 'ArtChain'} - 艺术品竞拍系统`

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isConnected) {
      next({ name: 'Home', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
