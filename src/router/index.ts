import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { pinia } from '../stores/pinia'
import { useAuthStore } from '../stores/auth'

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
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)
  const loggedIn = authStore.isLoggedIn

  // 访问需要登录的页面，但未登录 -> 去登录页
  if (to.meta?.requiresAuth && !loggedIn) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // 已登录还访问登录页 -> 回到首页/原目标
  if (to.name === 'login' && loggedIn) {
    const redirect = (to.query.redirect as string | undefined) || '/'
    return redirect
  }
})

export default router
