import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string | null>(null);
    const username = ref("");

    const isLoggedIn = computed(() => typeof token.value === "string" && token.value.trim().length > 0);

    function login(name: string, authToken?: string) {
      // 使用后端返回的 token，如果没有则使用默认值
      token.value = authToken || `mock_token_${Date.now()}`;
      username.value = name;
    }

    function logout() {
      token.value = null;
      username.value = "";
    }

    return { token, username, isLoggedIn, login, logout };
  },
  {
    persist: {
      key: "pinia_auth",
      storage: localStorage,
      pick: ["token", "username"],
    },
  }
);

