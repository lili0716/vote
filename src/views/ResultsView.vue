<template>
  <div class="results-container">
    <a-card>
      <template #title>
        <div class="card-header">
          <h2>投票结果</h2>
          <p>查看所有节目的投票情况</p>
        </div>
      </template>
      <div v-if="loading" class="loading-container">
        <a-skeleton :rows="5" animated />
      </div>
      <div v-else-if="results" class="results-content">
        <a-divider orientation="left">最佳节目</a-divider>
        <div class="result-section">
          <a-table 
            :columns="columnsBestProgram" 
            :data-source="results.winners?.bestProgram || results.programs || []" 
            bordered
          />
        </div>
        <a-divider orientation="left">最佳表演</a-divider>
        <div class="result-section">
          <a-table 
            :columns="columnsBestPerformance" 
            :data-source="results.winners?.bestPerformance || results.programs || []" 
            bordered
          />
        </div>
        <a-divider orientation="left">最佳创意</a-divider>
        <div class="result-section">
          <a-table 
            :columns="columnsBestCreativity" 
            :data-source="results.winners?.bestCreativity || results.programs || []" 
            bordered
          />
        </div>
      </div>
      <div v-else class="error-container">
        <a-empty description="无法加载投票结果" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import { Card, Skeleton, Divider, Table, Empty } from "ant-design-vue";
import { getVoteResultsApi } from "../api";

const loading = ref(true);
const results = ref<any>(null);

const columnsBestProgram = [
  {
    title: '排名',
    width: 80,
    customRender: (date) => {
      return {
        children: date.index + 1,
        attrs: {
          class: 'rank-cell'
        }
      };
    }
  },
  {
    title: '节目名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '得票数',
    dataIndex: 'bestProgram',
    key: 'bestProgram',
    customRender: (date) => {
      return typeof date.record[date.column.dataIndex] === 'number' ? date.record[date.column.dataIndex] : 0;
    }
  }
];

const columnsBestPerformance = [
  {
    title: '排名',
    width: 80,
    customRender: (date) => {
      return {
        children: date.index + 1,
        attrs: {
          class: 'rank-cell'
        }
      };
    }
  },
  {
    title: '节目名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '得票数',
    dataIndex: 'bestPerformance',
    key: 'bestPerformance',
    customRender: (date) => {
      return typeof date.record[date.column.dataIndex] === 'number' ? date.record[date.column.dataIndex] : 0;
    }
  }
];

const columnsBestCreativity = [
  {
    title: '排名',
    width: 80,
    customRender: (date) => {
      return {
        children: date.index + 1,
        attrs: {
          class: 'rank-cell'
        }
      };
    }
  },
  {
    title: '节目名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '得票数',
    dataIndex: 'bestCreativity',
    key: 'bestCreativity',
    customRender: (date) => {
      return typeof date.record[date.column.dataIndex] === 'number' ? date.record[date.column.dataIndex] : 0;
    }
  }
];

const fetchResults = async () => {
  try {
    loading.value = true;
    const response = await getVoteResultsApi();
    results.value = response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "获取结果失败，请重试";
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchResults();
});
</script>

<style scoped lang="scss">
.results-container {
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

.loading-container {
  padding: 20px;
}

.results-content {
  .result-section {
    margin-bottom: 30px;
  }
}

.rank-cell {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  background: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
}

.rank-cell:nth-of-type(1) {
  background: #ffd700;
  color: #fff;
}

.rank-cell:nth-of-type(2) {
  background: #c0c0c0;
  color: #fff;
}

.rank-cell:nth-of-type(3) {
  background: #cd7f32;
  color: #fff;
}

.error-container {
  padding: 40px 0;
}
</style>