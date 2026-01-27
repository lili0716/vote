<template>
  <div class="vote-container">
    <!-- 投票说明 -->
    <div class="vote-notice">
      <a-alert type="warning" :show-icon="false">
        <template #message>
          <div>
            <strong>⚠️ 投票规则</strong>
            <p>您只能选择一个奖项进行投票，一旦投票后将无法更改</p>
          </div>
        </template>
      </a-alert>
    </div>

    <!-- 投票状态提示 -->
    <div v-if="displayHasVoted" class="vote-status">
      <a-alert type="success" :show-icon="false">
        <template #message>
          <div>
            <strong>✅ 已投票</strong>
            <p>您已为以下节目投票：</p>
            <div class="vote-records">
              <div
                v-for="record in authStore.voteRecords"
                :key="record.id"
                class="vote-record-item"
              >
                <a-tag color="blue">{{ getAwardName(record.awardType) }}</a-tag>
                <span>{{ record.programName || `节目 #${record.programId}` }}</span>
              </div>
            </div>
          </div>
        </template>
      </a-alert>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>加载节目列表中...</p>
    </div>

    <!-- 奖项列表 -->
    <div v-else class="awards-container">
      <div
        v-for="award in awards"
        :key="award.id"
        class="award-card"
        :class="{
          'award-voted': voteStore.isAwardVoted(award.id),
          'award-disabled': displayHasVoted && !voteStore.isAwardVoted(award.id),
        }"
      >
        <div class="award-header">
          <div class="award-icon">
            <span class="award-emoji">{{ award.icon }}</span>
          </div>
          <h2 class="award-title">{{ award.name }}</h2>
          <div v-if="voteStore.isAwardVoted(award.id)" class="voted-badge">✅ 已投票</div>
        </div>

        <div class="programs-grid">
          <div
            v-for="program in programs"
            :key="program.id"
            class="program-card"
            :class="{
              'program-selected':
                voteStore.isAwardVoted(award.id) &&
                voteStore.votedProgramId === String(program.id),
              'program-disabled':
                displayHasVoted &&
                (voteStore.votedProgramId !== String(program.id) ||
                  !voteStore.isAwardVoted(award.id)),
            }"
            @click="handleVote(award.id, program.id)"
          >
            <div class="program-number">{{ program.id }}</div>
            <div class="program-name">{{ program.name }}</div>
            <div
              v-if="
                voteStore.isAwardVoted(award.id) &&
                voteStore.votedProgramId === String(program.id)
              "
              class="selected-mark"
            >
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import { Alert, Spin, Tag } from "ant-design-vue";
import { useVoteStore } from "../stores/vote";
import { useAuthStore } from "../stores/auth";
import { voteApi, getProgramsApi } from "../api";

const voteStore = useVoteStore();
const authStore = useAuthStore();
const voting = ref(false);
const loading = ref(true);
const programs = ref<Array<{ id: number; name: string }>>([]);

// 奖项列表（对应后端的awardTypes）
const awards = [
  { id: "bestProgram", name: "最佳节目奖", icon: "🏆" },
  { id: "bestPerformance", name: "最佳表演奖", icon: "🎤" },
  { id: "bestCreativity", name: "最佳创意奖", icon: "💡" },
];

// 加载节目列表
const loadPrograms = async () => {
  loading.value = true;
  try {
    const response = await getProgramsApi();
    if (response.programs) {
      programs.value = response.programs.map((p) => ({
        id: p.id,
        name: p.name,
      }));
    }
  } catch (error) {
    console.error("加载节目列表失败:", error);
    message.error("加载节目列表失败");
  } finally {
    loading.value = false;
  }
};

// 处理投票
const handleVote = (awardId: string, programId: number) => {
  // 检查用户是否已登录
  if (!authStore.userId) {
    message.warning("请先登录再投票");
    return;
  }

  // 如果已投票，不允许再投票
  if (voteStore.hasVoted || authStore.hasVoted) {
    message.warning("您已经投票，无法再次投票！");
    return;
  }

  // 如果正在投票中，不允许重复点击
  if (voting.value) {
    return;
  }

  // 显示确认弹窗
  const awardName = getAwardName(awardId);
  const programName = getProgramName(programId);

  Modal.confirm({
    title: "确认投票",
    content: `您确定要为"${awardName}"投票，选择的节目是"${programName}"吗？投票后将无法更改。`,
    okText: "确认投票",
    cancelText: "取消",
    onOk: async () => {
      // 确认投票，调用后端接口
      voting.value = true;
      try {
        const response = await voteApi({
          userId: authStore.userId!,
          votes: [
            {
              programId: programId,
              awardType: awardId,
            },
          ],
        });

        // 投票成功，更新本地状态
        voteStore.vote(awardId, String(programId));
        authStore.updateVoteStatus(true);
        message.success(
          `投票成功！您已为"${awardName}"投票，选择的节目是"${programName}"`
        );
      } catch (error: any) {
        // 处理投票失败
        const errorMessage =
          error?.response?.data?.message || error?.message || "投票失败，请重试";
        message.error(errorMessage);
      } finally {
        voting.value = false;
      }
    },
    onCancel: () => {
      // 取消投票
      message.info("已取消投票");
    },
  });
};

// 获取奖项名称
const getAwardName = (awardId: string) => {
  return awards.find((a) => a.id === awardId)?.name || "";
};

// 获取节目名称
const getProgramName = (programId: number) => {
  return programs.value.find((p) => p.id === programId)?.name || "";
};

// 获取已投票的奖项名称
const getVotedAwardName = () => {
  if (!voteStore.votedAwardId) return "";
  return getAwardName(voteStore.votedAwardId);
};

// 获取已投票的节目名称
const getVotedProgramName = () => {
  if (!voteStore.votedProgramId) return "";
  return getProgramName(Number(voteStore.votedProgramId));
};

// 是否显示已投票状态（优先使用authStore的状态）
const displayHasVoted = computed(() => authStore.hasVoted || voteStore.hasVoted);

// 初始化：加载节目列表
onMounted(() => {
  loadPrograms();
});
</script>

<style scoped lang="scss">
.vote-container {
  min-height: 100%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%);
  padding: 20px 0;
}

// 投票说明
.vote-notice {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

// 投票状态
.vote-status {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

// 投票记录
.vote-records {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vote-record-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  font-size: 14px;
}

// 奖项容器
.awards-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

// 奖项卡片
.award-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 3px solid transparent;

  &.award-voted {
    border-color: #ff4d4f;
    background: linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%);
    box-shadow: 0 10px 40px rgba(255, 77, 79, 0.3);
  }

  &.award-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

// 奖项头部
.award-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  position: relative;

  .award-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(255, 77, 79, 0.4);

    .award-emoji {
      font-size: 32px;
    }
  }

  .award-title {
    flex: 1;
    margin: 0;
    font-size: 28px;
    font-weight: bold;
    color: #c41d7f;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .voted-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #ff4d4f;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
  }
}

// 节目网格
.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

// 节目卡片
.program-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover:not(.program-disabled) {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(255, 77, 79, 0.3);
    border-color: #ff7875;
  }

  &.program-selected {
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    color: white;
    border-color: #c41d7f;
    box-shadow: 0 8px 25px rgba(255, 77, 79, 0.5);

    .program-number,
    .program-name {
      color: white;
    }
  }

  &.program-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .program-number {
    font-size: 24px;
    font-weight: bold;
    color: #ff4d4f;
    margin-bottom: 8px;
  }

  .program-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .selected-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff4d4f;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .header-image {
    height: 200px;
  }

  .award-card {
    padding: 20px;
  }

  .award-title {
    font-size: 22px;
  }

  .programs-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  .program-card {
    padding: 15px;
  }
}
</style>
