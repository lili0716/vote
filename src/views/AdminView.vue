<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>👨‍💼 管理员面板</h1>
      <p>远程数据库用户同步</p>
    </div>

    <div class="admin-content">
      <a-card title="同步用户信息" :bordered="false">
        <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
          <a-form-item label="数据库IP" name="host">
            <a-input v-model:value="formData.host" placeholder="例如: 192.168.1.100" />
          </a-form-item>
          <a-form-item label="数据库用户名" name="user">
            <a-input v-model:value="formData.user" placeholder="数据库用户名" />
          </a-form-item>
          <a-form-item label="数据库密码" name="password">
            <a-input
              v-model:value="formData.password"
              type="password"
              placeholder="数据库密码"
              allow-clear
            />
          </a-form-item>
          <a-form-item label="数据库名" name="database">
            <a-input v-model:value="formData.database" placeholder="数据库名" />
          </a-form-item>
          <a-form-item label="表名" name="tableName">
            <a-input v-model:value="formData.tableName" placeholder="用户表名" />
          </a-form-item>
          <a-form-item label="筛选字段" name="filterField">
            <a-input
              v-model:value="formData.filterField"
              placeholder="例如: department_id（可选）"
            />
          </a-form-item>
          <a-form-item label="筛选值" name="filterValue">
            <a-input v-model:value="formData.filterValue" placeholder="例如: 1（可选）" />
          </a-form-item>
          <a-form-item>
            <div class="sync-button-container">
              <a-button
                type="primary"
                size="large"
                :loading="syncing"
                @click="handleSync"
              >
                开始同步
              </a-button>
            </div>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 同步结果 -->
      <a-card v-if="syncResult" title="同步结果" :bordered="false" class="result-card">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="总记录数">
            <a-tag color="blue">{{ syncResult.total }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="成功同步">
            <a-tag color="green">{{ syncResult.success }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="同步失败">
            <a-tag color="red">{{ syncResult.failed }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <div
          v-if="syncResult.syncedUsers && syncResult.syncedUsers.length > 0"
          class="synced-users"
        >
          <h4>已同步的用户：</h4>
          <a-table
            :columns="columns"
            :data-source="syncResult.syncedUsers"
            :scroll="{ y: 300 }"
          />
        </div>
      </a-card>

      <!-- 投票结果 -->
      <a-card title="投票统计" :bordered="false" class="result-card">
        <a-spin v-if="loadingResults" />
        <template v-else>
          <a-descriptions :column="1" bordered v-if="voteResults">
            <a-descriptions-item label="已投票人数">
              <a-tag color="green">{{ voteResults.statistics?.votedUsers }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="总用户数">
              <a-tag color="blue">{{ voteResults.statistics?.totalUsers }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="投票率">
              <a-tag color="orange">{{ voteResults.statistics?.votingRate }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <div v-if="voteResults && voteResults.programs" class="programs-stats">
            <h4>节目得票情况：</h4>
            <div
              v-for="program in voteResults.programs"
              :key="program.id"
              class="program-stat-item"
            >
              <span class="program-name">{{ program.name }}</span>
              <div class="vote-counts">
                <a-tag>最佳节目: {{ program.bestProgram }}</a-tag>
                <a-tag>最佳表演: {{ program.bestPerformance }}</a-tag>
                <a-tag>最佳创意: {{ program.bestCreativity }}</a-tag>
              </div>
            </div>
          </div>
        </template>
        <a-button
          type="default"
          block
          @click="loadVoteResults"
          :loading="loadingResults"
          style="margin-top: 20px"
        >
          刷新投票结果
        </a-button>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
  Card,
  Form,
  Input,
  Button,
  Tag,
  Descriptions,
  Table,
  Spin,
} from "ant-design-vue";
import { syncUsersApi, getVoteResultsApi } from "../api";

const formRef = ref();
const syncing = ref(false);
const loadingResults = ref(false);
const syncResult = ref<any>(null);
const voteResults = ref<any>(null);

const formData = reactive({
  host: "",
  user: "",
  password: "",
  database: "",
  tableName: "",
  filterField: "",
  filterValue: "",
});

const rules = {
  host: [{ required: true, message: "请输入数据库IP", trigger: "blur" }],
  user: [{ required: true, message: "请输入数据库用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入数据库密码", trigger: "blur" }],
  database: [{ required: true, message: "请输入数据库名", trigger: "blur" }],
  tableName: [{ required: true, message: "请输入表名", trigger: "blur" }],
};

const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "姓名",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "工号",
    dataIndex: "employeeId",
    key: "employeeId",
  },
  {
    title: "状态",
    dataIndex: "created",
    key: "created",
    customRender: (created: boolean) => {
      return created ? "新建" : "已存在";
    },
  },
];

const handleSync = async () => {
  try {
    await formRef.value?.validateFields();
    syncing.value = true;
    syncResult.value = null;

    const response = await syncUsersApi({
      remoteDBConfig: {
        host: formData.host,
        user: formData.user,
        password: formData.password,
        database: formData.database,
      },
      tableName: formData.tableName,
      filterField: formData.filterField || undefined,
      filterValue: formData.filterValue || undefined,
    });

    if (response.results) {
      syncResult.value = response.results;
      message.success(`同步完成！成功同步 ${response.results.success} 条记录`);
    } else if (response.error) {
      message.error(`同步失败: ${response.error}`);
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "同步失败，请检查数据库配置";
    message.error(errorMessage);
  } finally {
    syncing.value = false;
  }
};

const loadVoteResults = async () => {
  try {
    loadingResults.value = true;
    const response = await getVoteResultsApi();
    voteResults.value = response;
  } catch (error: any) {
    message.error("获取投票结果失败");
  } finally {
    loadingResults.value = false;
  }
};

onMounted(() => {
  loadVoteResults();
});
</script>

<style scoped lang="scss">
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px 20px;
}

.admin-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;

  h1 {
    font-size: 36px;
    margin: 0 0 10px;
  }

  p {
    font-size: 18px;
    opacity: 0.8;
    margin: 0;
  }
}

.admin-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-content :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.admin-content :deep(.ant-form-item-label label) {
  color: #333;
  font-weight: 500;
}

.admin-content :deep(.ant-input),
.admin-content :deep(.ant-input-password) {
  background: white;
  border-radius: 4px;
}

.sync-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.result-card {
  margin-top: 20px;
}

.synced-users {
  margin-top: 20px;

  h4 {
    margin: 0 0 10px;
    color: #333;
  }
}

.programs-stats {
  margin-top: 20px;

  h4 {
    margin: 0 0 15px;
    color: #333;
  }
}

.program-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 10px;

  .program-name {
    font-weight: bold;
    font-size: 16px;
  }

  .vote-counts {
    display: flex;
    gap: 10px;
  }
}
</style>
