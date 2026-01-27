import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { pinia } from '../stores/pinia'
import { useAuthStore } from '../stores/auth'
import { message } from 'ant-design-vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login.vue'),
    },
    {
      path: '/',
      component: HomeView,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'vote',
          component: () => import('../views/VoteView.vue'),
          meta: { requiresAdmin: false },
        },
        {
          path: 'sync',
          name: 'sync',
          component: () => import('../views/SyncView.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: 'results',
          name: 'results',
          component: () => import('../views/ResultsView.vue'),
          meta: { requiresAdmin: true },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)
  const loggedIn = authStore.isLoggedIn
  const isAdmin = authStore.isAdmin

  // 访问需要登录的页面，但未登录 -> 去登录页
  if (to.meta?.requiresAuth && !loggedIn) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // 管理员访问投票页面 -> 跳转到结果页面
  if (to.name === 'vote' && isAdmin) {
    return '/results'
  }

  // 访问需要管理员权限的页面，但不是管理员 -> 回到投票页
  if (to.meta?.requiresAdmin && !isAdmin) {
    return '/'
  }

  // 已登录还访问登录页 -> 根据用户角色重定向
  if (to.name === 'login' && loggedIn) {
    return isAdmin ? '/results' : '/'
  }
})

export default router