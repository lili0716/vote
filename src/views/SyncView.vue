<template>
  <div class="sync-container">
    <!-- Excel导入页面 -->
    <div v-if="$route.name === 'sync'">
      <a-card>
        <template #title>
          <div class="card-header">
            <h2>Excel导入</h2>
            <p>从Excel文件批量导入用户信息</p>
          </div>
        </template>
        <div class="excel-import-section">
          <a-upload
            v-model:file-list="fileList"
            :multiple="false"
            :before-upload="beforeUpload"
            :disabled="importing"
            accept=".xlsx,.xls"
          >
            <a-button type="primary" :loading="importing">
              <template #icon>
                <upload-outlined />
              </template>
              选择Excel文件
            </a-button>
          </a-upload>
          <p class="upload-hint">支持.xlsx和.xls格式，文件大小不超过10MB</p>
          <p class="upload-hint">Excel格式要求：包含name（姓名）和employeeId（工号）列</p>
          <a-button
            type="primary"
            @click="handleImport"
            :loading="importing"
            :disabled="!fileList.length || importing"
            style="margin-top: 10px"
          >
            开始导入
          </a-button>

          <!-- 导入结果 -->
          <div v-if="importResult" class="import-result">
            <a-divider>导入结果</a-divider>
            <a-card>
              <a-descriptions :column="1" bordered>
                <a-descriptions-item label="总记录数">
                  <a-tag color="blue">{{ importResult.total }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="成功导入">
                  <a-tag color="green">{{ importResult.success }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="导入失败">
                  <a-tag color="red">{{ importResult.failed }}</a-tag>
                </a-descriptions-item>
              </a-descriptions>

              <div
                v-if="importResult.importedUsers && importResult.importedUsers.length > 0"
                class="imported-users"
              >
                <h4>已导入的用户：</h4>
                <a-table
                  :columns="importColumns"
                  :data-source="importResult.importedUsers"
                  :scroll="{ y: 300 }"
                />
              </div>
            </a-card>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 数据清洗页面 -->
    <div v-else-if="$route.name === 'cleanup'">
      <a-card>
        <template #title>
          <div class="card-header">
            <h2>数据清洗</h2>
            <p>重置投票结果和用户数据</p>
          </div>
        </template>
        <div class="cleanup-section">
          <a-card type="inner" title="投票结果重置">
            <p>重置所有节目的得票数为0，并清除所有投票记录</p>
            <a-button
              type="danger"
              :loading="cleaning"
              @click="handleResetVotes"
            >
              重置投票结果
            </a-button>
          </a-card>
          
          <a-card type="inner" title="用户表清空" style="margin-top: 20px;">
            <p>清空所有用户数据（保留root账户）</p>
            <a-button
              type="danger"
              :loading="cleaning"
              @click="handleCleanupUsers"
            >
              清空用户表
            </a-button>
          </a-card>
          
          <a-card v-if="cleanupResult" type="inner" title="操作结果" style="margin-top: 20px;">
            <a-alert 
              :message="cleanupResult.message" 
              :type="cleanupResult.success ? 'success' : 'error'" 
              show-icon 
            />
          </a-card>
        </div>
      </a-card>
    </div>

    <!-- 数据库同步页面 -->
    <div v-else-if="$route.name === 'database'">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import { Card, Form, Input, Button, Divider, Space, Statistic, Alert, Upload, Table, Descriptions, Tag } from "ant-design-vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import { syncUsersApi } from "../api";

const formRef = ref();
const loading = ref(false);
const syncResult = ref<any>(null);

// Excel导入相关变量
const fileList = ref<any[]>([]);
const importing = ref(false);
const importResult = ref<any>(null);

// 数据清洗相关变量
const cleaning = ref(false);
const cleanupResult = ref<any>(null);

const importColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '工号',
    dataIndex: 'employeeId',
    key: 'employeeId',
  },
  {
    title: '状态',
    dataIndex: 'created',
    key: 'created',
    customRender: (created: boolean) => {
      return created ? '新建' : '已存在';
    },
  },
];

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

// 文件上传前验证
const beforeUpload = (file: any) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    message.error('只支持Excel文件(.xlsx, .xls)');
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过10MB');
    return false;
  }
  return false; // 阻止自动上传，使用手动上传
};

// 处理Excel导入
const handleImport = async () => {
  if (!fileList.value || fileList.value.length === 0) {
    message.error('请先选择Excel文件');
    return;
  }

  try {
    importing.value = true;
    importResult.value = null;

    const file = fileList.value[0].originFileObj;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/import-users', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '导入失败');
    }

    const result = await response.json();
    
    if (result.results) {
      importResult.value = result.results;
      message.success(`导入完成！成功导入 ${result.results.success} 条记录`);
      // 清空文件列表
      fileList.value = [];
    } else if (result.error) {
      message.error(`导入失败: ${result.error}`);
    }
  } catch (error: any) {
    const errorMessage = error?.message || '导入失败，请稍后重试';
    message.error(errorMessage);
  } finally {
    importing.value = false;
  }
};

// 重置投票结果
const handleResetVotes = async () => {
  try {
    cleaning.value = true;
    cleanupResult.value = null;
    
    const response = await fetch('/api/admin/reset-votes', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '重置失败');
    }
    
    const result = await response.json();
    cleanupResult.value = {
      success: true,
      message: result.message || '投票结果重置成功'
    };
    message.success('投票结果重置成功');
  } catch (error: any) {
    const errorMessage = error?.message || '重置失败，请稍后重试';
    cleanupResult.value = {
      success: false,
      message: errorMessage
    };
    message.error(errorMessage);
  } finally {
    cleaning.value = false;
  }
};

// 清空用户表
const handleCleanupUsers = async () => {
  try {
    cleaning.value = true;
    cleanupResult.value = null;
    
    const response = await fetch('/api/admin/cleanup-users', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '清空失败');
    }
    
    const result = await response.json();
    cleanupResult.value = {
      success: true,
      message: result.message || '用户表清空成功'
    };
    message.success('用户表清空成功');
  } catch (error: any) {
    const errorMessage = error?.message || '清空失败，请稍后重试';
    cleanupResult.value = {
      success: false,
      message: errorMessage
    };
    message.error(errorMessage);
  } finally {
    cleaning.value = false;
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

.excel-import-section {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-top: 20px;
  
  .upload-hint {
    color: #666;
    font-size: 14px;
    margin: 10px 0;
  }
}

.import-result {
  margin-top: 20px;
  
  h4 {
    margin: 0 0 10px;
    color: #333;
  }
}

.imported-users {
  margin-top: 10px;
}
</style>