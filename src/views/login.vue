<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <template #title>
        <div class="login-header">
          <h2>登录</h2>
        </div>
      </template>
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        size="large"
      >
        <a-form-item label="工号" name="username">
          <a-input
            v-model:value="formData.username"
            placeholder="请输入工号"
            :maxlength="50"
            allow-clear
            @keyup.enter="handleLogin"
          />
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { Card, Form, Input, Button } from "ant-design-vue";
import { useAuthStore } from "../stores/auth";
import { loginApi } from "../api";

const router = useRouter();
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
      message: "请输入工号",
      trigger: ["input", "blur"],
    },
  ],
};

const handleLogin = async () => {
  try {
    await formRef.value?.validateFields();
    loading.value = true;

    try {
      // 调用登录接口
      const response = await loginApi({
        employeeId: formData.username,
      });

      if (response.user) {
        // 保存登录态（使用后端返回的 token）
        authStore.login(
          response.user.name,
          response.token || `mock_token_${Date.now()}`,
          {
            id: response.user.id,
            role: response.user.role,
            hasVoted: response.user.hasVoted,
          },
          response.voteRecords || []
        );
        message.success(`欢迎，${response.user.name}！`);

        // 登录成功后根据角色跳转到不同页面
        const isAdmin = response.user.role === "admin";
        const redirect =
          (router.currentRoute.value.query.redirect as string | undefined) ||
          (isAdmin ? "/results" : "/");
        router.push(redirect);
      } else {
        // 兼容旧版本的响应格式
        authStore.login(formData.username, response.token, undefined, []);
        message.success(`欢迎，${formData.username}！`);
        const redirect =
          (router.currentRoute.value.query.redirect as string | undefined) || "/";
        router.push(redirect);
      }
    } catch (error: any) {
      // 处理登录失败
      const errorMessage =
        error?.response?.data?.message || error?.message || "登录失败，请重试";
      message.error(errorMessage);
    } finally {
      loading.value = false;
    }
  } catch (error) {
    console.error("表单验证失败", error);
    loading.value = false;
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
