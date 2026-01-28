<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Layout, Menu, Avatar, Dropdown, Space } from "ant-design-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const activeKey = computed(() => route.name as string);

const menuItems = computed(() => {
  const items = [];

  // 如果不是管理员，显示投票功能
  if (!authStore.isAdmin) {
    items.push({
      label: "投票",
      key: "vote",
    });
  } else {
    // 如果是管理员，显示管理功能
    items.push(
      {
        label: "投票结果",
        key: "results",
      },
      {
        label: "Excel导入",
        key: "sync",
      },
      {
        label: "数据库同步",
        key: "database",
      },
      {
        label: "数据清洗",
        key: "cleanup",
      }
    );
  }

  return items;
});

const userMenu = [
  {
    key: "logout",
    label: "退出登录",
  },
];

const handleMenuSelect = (e: any) => {
  const key = e.key;
  router.push(key === "vote" ? "/" : `/${key}`);
};

const handleUserAction = (e: any) => {
  const key = e.key;
  if (key === "logout") {
    authStore.logout();
    router.push("/login");
  }
};

const getPageTitle = () => {
  if (route.name === "sync") {
    return "Excel导入";
  } else if (route.name === "database") {
    return "数据库同步";
  } else if (route.name === "results") {
    return "投票结果";
  } else if (route.name === "cleanup") {
    return "数据清洗";
  } else if (route.name === "admin") {
    return "管理后台";
  } else {
    return "年会投票系统";
  }
};
</script>

<template>
  <!-- 根据用户角色显示不同的布局 -->
  <a-layout :has-sider="authStore.isAdmin" class="home-layout">
    <!-- 左侧菜单（仅管理员可见） -->
    <a-layout-sider
      v-if="authStore.isAdmin"
      :width="240"
      :collapsible="false"
      :trigger="null"
    >
      <div class="logo">
        <h2>🎭 年会投票</h2>
      </div>
      <a-menu
        :items="menuItems"
        :selected-keys="[activeKey]"
        @select="handleMenuSelect"
        mode="inline"
        :theme="'dark'"
      />
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout class="main-layout">
      <!-- 顶部导航 -->
      <a-layout-header class="header">
        <div class="header-content">
          <h1>{{ getPageTitle() }}</h1>

          <div class="user-info">
            <a-space align="center">
              <span class="username">{{ authStore.username }}</span>
              <a-dropdown>
                <template #overlay>
                  <a-menu @click="handleUserAction">
                    <a-menu-item key="logout">退出登录</a-menu-item>
                  </a-menu>
                </template>
                <a-avatar size="medium" class="user-avatar">
                  {{ authStore.username?.charAt(0)?.toUpperCase() }}
                </a-avatar>
              </a-dropdown>
            </a-space>
          </div>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped lang="scss">
.home-layout {
  min-height: 100vh;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #eee;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #667eea;
  }
}

.menu-icon {
  font-size: 18px;
  margin-right: 8px;
}

.main-layout {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  height: 64px;

  h1 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-right: 12px;
  font-size: 14px;
  color: #666;
}

.user-avatar {
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}
</style>
