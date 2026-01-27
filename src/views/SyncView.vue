<template>
  <div class="sync-container">
    <a-card>
      <template #title>
        <div class="card-header">
          <h2>数据库同步</h2>
          <p>从远程数据库同步用户信息到本地员工表</p>
        </div>
      </template>
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="数据库地址" name="host">
          <a-input
            v-model:value="formData.host"
            placeholder="请输入远程数据库IP地址"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="用户名" name="user">
          <a-input
            v-model:value="formData.user"
            placeholder="请输入数据库用户名"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入数据库密码"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="数据库名" name="database">
          <a-input
            v-model:value="formData.database"
            placeholder="请输入数据库名称"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="表名" name="table">
          <a-input
            v-model:value="formData.table"
            placeholder="请输入用户表名"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            :loading="loading"
            @click="handleSync"
          >
            开始同步
          </a-button>
        </a-form-item>
      </a-form>
      <div v-if="syncResult" class="sync-result">
        <a-divider>同步结果</a-divider>
        <a-card>
          <a-space direction="vertical">
            <a-statistic title="同步状态" :value="syncResult.success ? '成功' : '失败'" />
            <a-statistic v-if="syncResult.success" title="同步用户数" :value="syncResult.count" />
            <a-alert v-if="syncResult.message" :message="syncResult.message" type="info" show-icon />
          </a-space>
        </a-card>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import { Card, Form, Input, Button, Divider, Space, Statistic, Alert } from "ant-design-vue";
import { syncUsersApi } from "../api";

const formRef = ref();
const loading = ref(false);
const syncResult = ref<any>(null);

const formData = reactive({
  host: "",
  user: "",
  password: "",
  database: "",
  table: "",
});

const rules = {
  host: [
    {
      required: true,
      message: "请输入数据库地址",
      trigger: ["input", "blur"],
    },
  ],
  user: [
    {
      required: true,
      message: "请输入用户名",
      trigger: ["input", "blur"],
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: ["input", "blur"],
    },
  ],
  database: [
    {
      required: true,
      message: "请输入数据库名",
      trigger: ["input", "blur"],
    },
  ],
  table: [
    {
      required: true,
      message: "请输入表名",
      trigger: ["input", "blur"],
    },
  ],
};

const handleSync = async () => {
  try {
    await formRef.value?.validateFields();
    loading.value = true;

    try {
      const syncParams = {
        remoteDBConfig: {
          host: formData.host,
          user: formData.user,
          password: formData.password,
          database: formData.database
        },
        tableName: formData.table
      };
      const response = await syncUsersApi(syncParams);
      syncResult.value = {
        success: true,
        count: response.results?.success || 0,
        message: response.message
      };
      message.success("同步完成！");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "同步失败，请重试";
      message.error(errorMessage);
      syncResult.value = {
        success: false,
        message: errorMessage,
      };
    } finally {
      loading.value = false;
    }
  } catch (error) {
    console.error("表单验证失败", error);
  }
};
</script>

<style scoped lang="scss">
.sync-container {
  padding: 20px;
}

.card-header {
  h2 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 20px;
    font-weight: 600;
  }
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.sync-result {
  margin-top: 20px;
}
</style>