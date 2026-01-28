<template>
  <div class="results-container">
    <a-card>
      <template #title>
        <div class="card-header">
          <div class="header-left">
            <h2>投票结果</h2>
            <p>实时更新所有节目的投票情况</p>
            <div class="update-info">
              <a-tag color="blue">上次更新: {{ lastUpdateTime }}</a-tag>
              <a-tag v-if="autoUpdate" color="green">自动更新中</a-tag>
            </div>
          </div>
          <div class="header-right">
            <a-button type="primary" @click="fetchResults" :loading="loading">
              手动刷新
            </a-button>
            <a-button
              :type="autoUpdate ? 'default' : 'primary'"
              @click="toggleAutoUpdate"
              style="margin-left: 8px"
            >
              {{ autoUpdate ? "停止自动更新" : "开启自动更新" }}
            </a-button>
          </div>
        </div>
      </template>
      <div class="results-content">
        <!-- 统计信息 -->
        <div class="statistics-section">
          <a-descriptions :column="3" bordered>
            <a-descriptions-item label="已投票人数">
              <a-tag color="green">{{ results?.statistics?.votedUsers || 0 }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="总用户数">
              <a-tag color="blue">{{ results?.statistics?.totalUsers || 0 }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="投票率">
              <a-tag color="orange">{{ results?.statistics?.votingRate || "0%" }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 最佳团体奖 -->
        <a-divider orientation="left">最佳团体奖</a-divider>
        <div class="chart-section">
          <div ref="bestProgramChart" class="chart-container"></div>
        </div>

        <!-- 最具氛围奖 -->
        <a-divider orientation="left">最具氛围奖</a-divider>
        <div class="chart-section">
          <div ref="bestPerformanceChart" class="chart-container"></div>
        </div>

        <!-- 最佳创意奖 -->
        <a-divider orientation="left">最佳创意奖</a-divider>
        <div class="chart-section">
          <div ref="bestCreativityChart" class="chart-container"></div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import {
  Card,
  Skeleton,
  Divider,
  Descriptions,
  Tag,
  Button,
  Empty,
} from "ant-design-vue";
import { getVoteResultsApi } from "../api";
import * as echarts from "echarts";

const loading = ref(true);
const results = ref<any>(null);
const autoUpdate = ref(false);
const lastUpdateTime = ref(getCurrentTime());
const updateInterval = ref<number | null>(null);

// 图表引用
const bestProgramChart = ref<HTMLElement | null>(null);
const bestPerformanceChart = ref<HTMLElement | null>(null);
const bestCreativityChart = ref<HTMLElement | null>(null);

// 图表实例
let bestProgramChartInstance: echarts.ECharts | null = null;
let bestPerformanceChartInstance: echarts.ECharts | null = null;
let bestCreativityChartInstance: echarts.ECharts | null = null;

// 获取当前时间
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleString();
}

// 获取投票结果
const fetchResults = async () => {
  try {
    loading.value = true;
    console.log("开始获取投票结果");
    const response = await getVoteResultsApi();
    console.log("获取投票结果成功:", response);
    results.value = response;
    lastUpdateTime.value = getCurrentTime();
    console.log("数据获取完成，开始更新图表");
    // 直接更新图表，不等待nextTick
    updateCharts();
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "获取结果失败，请重试";
    console.error("获取投票结果失败:", error);
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 切换自动更新
const toggleAutoUpdate = () => {
  autoUpdate.value = !autoUpdate.value;
  if (autoUpdate.value) {
    startAutoUpdate();
    message.success("已开启自动更新");
  } else {
    stopAutoUpdate();
    message.info("已停止自动更新");
  }
};

// 开始自动更新
const startAutoUpdate = () => {
  // 每5秒更新一次
  if (!updateInterval.value) {
    updateInterval.value = window.setInterval(() => {
      fetchResults();
    }, 5000);
  }
};

// 停止自动更新
const stopAutoUpdate = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
};

// 更新图表
const updateCharts = () => {
  console.log("进入updateCharts函数");
  console.log("results.value:", results.value);
  console.log("bestProgramChart.value:", bestProgramChart.value);
  console.log("bestPerformanceChart.value:", bestPerformanceChart.value);
  console.log("bestCreativityChart.value:", bestCreativityChart.value);

  if (!results.value || !results.value.programs) {
    console.log("没有结果数据，跳过更新图表");
    return;
  }

  const programs = results.value.programs;
  console.log("开始更新图表，节目数据:", programs);

  // 初始化或更新最佳团体奖图表
  if (bestProgramChart.value) {
    if (!bestProgramChartInstance) {
      console.log("初始化最佳团体奖图表实例");
      bestProgramChartInstance = echarts.init(bestProgramChart.value);
    }
    console.log("更新最佳团体奖图表数据");
    updateChart(bestProgramChartInstance, programs, "bestProgram", "最佳团体奖");
  } else {
    console.warn("最佳团体奖图表容器不存在");
  }

  // 初始化或更新最具氛围奖图表
  if (bestPerformanceChart.value) {
    if (!bestPerformanceChartInstance) {
      console.log("初始化最具氛围奖图表实例");
      bestPerformanceChartInstance = echarts.init(bestPerformanceChart.value);
    }
    console.log("更新最具氛围奖图表数据");
    updateChart(bestPerformanceChartInstance, programs, "bestPerformance", "最具氛围奖");
  } else {
    console.warn("最具氛围奖图表容器不存在");
  }

  // 初始化或更新最佳创意奖图表
  if (bestCreativityChart.value) {
    if (!bestCreativityChartInstance) {
      console.log("初始化最佳创意奖图表实例");
      bestCreativityChartInstance = echarts.init(bestCreativityChart.value);
    }
    console.log("更新最佳创意奖图表数据");
    updateChart(bestCreativityChartInstance, programs, "bestCreativity", "最佳创意奖");
  } else {
    console.warn("最佳创意奖图表容器不存在");
  }

  console.log("图表更新完成");
};

// 更新单个图表
const updateChart = (
  chartInstance: echarts.ECharts,
  programs: any[],
  awardType: string,
  awardName: string
) => {
  // 准备数据
  const programNames = programs.map((p) => p.name);
  const voteCounts = programs.map((p) => p[awardType] || 0);

  // 图表配置
  const option = {
    title: {
      text: awardName,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: any) {
        const data = params[0];
        return `${data.name}<br/>得票数: ${data.value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: programNames,
      axisLabel: {
        interval: 0,
        rotate: 45,
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      name: "得票数",
      minInterval: 1,
    },
    series: [
      {
        name: "得票数",
        type: "bar",
        data: voteCounts,
        itemStyle: {
          color: function (params: any) {
            // 颜色渐变
            const colors = [
              "#ff7875",
              "#ffb84d",
              "#ffa39e",
              "#ffc53d",
              "#a0d911",
              "#73d13d",
              "#40a9ff",
              "#597ef7",
              "#9254de",
              "#eb2f96",
            ];
            return colors[params.dataIndex % colors.length];
          },
        },
        label: {
          show: true,
          position: "top",
          fontSize: 12,
        },
        animationDelay: function (idx: number) {
          return idx * 100;
        },
      },
    ],
    animationEasing: "elasticOut" as any,
    animationDelayUpdate: function (idx: number) {
      return idx * 5;
    },
  };

  chartInstance.setOption(option);
};

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  bestProgramChartInstance?.resize();
  bestPerformanceChartInstance?.resize();
  bestCreativityChartInstance?.resize();
};

// 监听结果变化，更新图表
watch(
  () => results.value,
  async () => {
    await nextTick();
    console.log("Watch监听到结果变化，DOM更新完成，开始更新图表");
    updateCharts();
  },
  { deep: true }
);

onMounted(() => {
  // 初始化数据
  fetchResults();
  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // 停止自动更新
  stopAutoUpdate();
  // 移除事件监听
  window.removeEventListener("resize", handleResize);
  // 销毁图表实例
  bestProgramChartInstance?.dispose();
  bestPerformanceChartInstance?.dispose();
  bestCreativityChartInstance?.dispose();
});
</script>

<style scoped lang="scss">
.results-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;

  .header-left {
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  h2 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  }
  p {
    margin: 0 0 12px 0;
    color: #666;
    font-size: 14px;
  }
}

.update-info {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.loading-container {
  padding: 40px;
}

.results-content {
  .statistics-section {
    margin-bottom: 30px;
  }

  .chart-section {
    margin-bottom: 40px;
  }

  .chart-container {
    width: 100%;
    height: 400px;
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;

    .header-right {
      width: 100%;
      justify-content: space-between;
    }
  }

  .chart-container {
    height: 300px !important;
    min-height: 300px !important;
  }

  .statistics-section {
    .ant-descriptions {
      :deep(.ant-descriptions-item) {
        font-size: 12px;
      }
    }
  }
}
</style>