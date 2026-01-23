import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string | null>(null);
    const username = ref("");

    const isLoggedIn = computed(() => typeof token.value === "string" && token.value.trim().length > 0);

    function login(name: string) {
      // 这里先用 mock token；接真实接口时用后端返回 token 替换
      token.value = `mock_token_${Date.now()}`;
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

