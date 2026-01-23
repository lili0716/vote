<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false">
      <template #header>
        <div class="login-header">
          <h2>登录</h2>
        </div>
      </template>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="80"
        size="large"
      >
        <n-form-item label="账号" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入账号"
            :maxlength="50"
            clearable
            @keyup.enter="handleLogin"
          />
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
} from "naive-ui";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();

const formRef = ref();
const loading = ref(false);

const formData = reactive({
  username: "",
});

const rules = {
  username: [
    {
      required: true,
      message: "请输入账号",
      trigger: ["input", "blur"],
    },
  ],
};

const handleLogin = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    // 模拟登录请求
    setTimeout(() => {
      loading.value = false;
      // 写入登录态（Pinia + 持久化）
      authStore.login(formData.username);
      message.success(`欢迎，${formData.username}！`);
      // 登录成功后：若有 redirect 则跳回，否则去首页
      const redirect = (router.currentRoute.value.query.redirect as string | undefined) || "/";
      router.push(redirect);
    }, 1000);
  } catch (error) {
    console.error("表单验证失败", error);
  }
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 10px;

  h2 {
    margin: 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  }
}
</style>