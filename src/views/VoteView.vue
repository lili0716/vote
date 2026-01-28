<template>
  <div class="vote-container">
    <!-- 投票说明 -->
    <div class="vote-notice">
      <a-alert type="warning" :show-icon="false">
        <template #message>
          <div>
            <strong>⚠️ 投票规则</strong>
            <p>每个奖项可以选择一个节目，一旦投票后将无法更改</p>
            <p>只有被标记为团体的节目才能参与最佳团体奖评选</p>
            <p>在一个奖项中选择的节目，在其他奖项中将变为不可选择状态</p>
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
        'award-disabled': authStore.hasVoted,
      }"
      >
        <div class="award-header">
          <div class="award-icon">
            <span class="award-emoji">{{ award.icon }}</span>
          </div>
          <h2 class="award-title">{{ award.name }}</h2>
        </div>

        <div class="programs-grid">
            <div
              v-for="program in (award.id === 'bestProgram' ? programs.filter(p => p.isGroup) : programs)"
              :key="program.id"
              class="program-card"
              :class="{
                'program-selected':
                  voteStore.getVotedProgram(award.id) === String(program.id),
                'program-disabled':
                  voteStore.isProgramVotedInOtherAwards(award.id, String(program.id)),
              }"
              @click="handleSelectProgram(award.id, program.id)"
            >
              <div class="program-number">{{ program.id }}</div>
              <div class="program-name">
                {{ program.name }}
              </div>
              <div
                v-if="voteStore.getVotedProgram(award.id) === String(program.id)"
                class="selected-mark"
              >
                ✓
              </div>
            </div>
          </div>
      </div>
    </div>

    <!-- 悬浮投票按钮 -->
    <div v-if="!authStore.hasVoted" class="floating-vote-button">
      <a-button
        type="primary"
        size="large"
        shape="circle"
        :loading="voting"
        :disabled="!voteStore.hasVotedInAnyAward()"
        @click="handleSubmitVote"
      >
        <template #icon>
          <CheckOutlined />
        </template>
      </a-button>
      <div class="floating-button-text">确认投票</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import { message, Modal } from "ant-design-vue";
import { Alert, Spin, Tag } from "ant-design-vue";
import { CheckOutlined } from "@ant-design/icons-vue";
import { useVoteStore } from "../stores/vote";
import { useAuthStore } from "../stores/auth";
import { voteApi, getProgramsApi } from "../api";

const voteStore = useVoteStore();
const authStore = useAuthStore();
const voting = ref(false);
const loading = ref(true);
const programs = ref<Array<{ id: number; name: string; isGroup: boolean }>>([]);

// 奖项列表（对应后端的awardTypes）
const awards = [
  { id: "bestProgram", name: "最佳团体奖", icon: "🏆" },
  { id: "bestPerformance", name: "最具氛围奖", icon: "🎤" },
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
        isGroup: p.isGroup || false,
      }));
    }
  } catch (error) {
    console.error("加载节目列表失败:", error);
    message.error("加载节目列表失败");
  } finally {
    loading.value = false;
  }
};

// 处理节目选择
const handleSelectProgram = (awardId: string, programId: number) => {
  // 检查用户是否已登录
  if (!authStore.userId) {
    message.warning("请先登录再投票");
    return;
  }

  // 如果已投票，不允许再选择
  if (authStore.hasVoted) {
    message.warning("您已经投票，无法再次选择！");
    return;
  }

  // 检查是否是最佳团体奖，只有团体节目才能选择
  if (awardId === "bestProgram") {
    const program = programs.value.find((p) => p.id === programId);
    if (!program?.isGroup) {
      message.warning("只有团体节目才能参与最佳团体奖评选");
      return;
    }
  }

  // 检查该节目是否在其他奖项中已被选择
  if (voteStore.isProgramVotedInOtherAwards(awardId, String(programId))) {
    message.warning("该节目已在其他奖项中被选择，无法再次选择");
    return;
  }

  // 更新投票状态
  voteStore.vote(awardId, String(programId));
  message.success(`已选择 ${getAwardName(awardId)}: ${getProgramName(programId)}`);
};

// 处理提交投票
const handleSubmitVote = () => {
  // 检查用户是否已登录
  if (!authStore.userId) {
    message.warning("请先登录再投票");
    return;
  }

  // 如果已投票，不允许再投票
  if (authStore.hasVoted) {
    message.warning("您已经投票，无法再次投票！");
    return;
  }

  // 检查是否为每个奖项都选择了节目
  const selectedAwards = awards.filter((award) => voteStore.getVotedProgram(award.id));
  if (selectedAwards.length === 0) {
    message.warning("请至少为一个奖项选择节目");
    return;
  }

  // 构建投票记录，用于弹窗显示
  const voteSelections = selectedAwards.map((award) => {
    const programId = voteStore.getVotedProgram(award.id);
    const programName = getProgramName(Number(programId));
    return {
      awardName: award.name,
      programName: programName,
    };
  });

  // 显示确认弹窗
  const contentNode = h('div', null, [
    h('p', null, '您确定要提交以下投票吗？投票后将无法更改。'),
    h('div', { style: { marginTop: '16px' } }, [
      ...voteSelections.map((selection) => {
        const award = awards.find(a => a.name === selection.awardName);
        const icon = award?.icon || '';
        return h('div', { style: { marginBottom: '8px' } }, [
          icon + ' ' + selection.awardName + ': ' + selection.programName
        ]);
      })
    ])
  ]);
  
  Modal.confirm({
    title: "确认投票",
    content: contentNode,
    okText: "确认投票",
    cancelText: "取消",
    onOk: async () => {
      // 确认投票，调用后端接口
      voting.value = true;
      try {
        // 构建投票数据
        const votes = selectedAwards.map((award) => {
          const programId = voteStore.getVotedProgram(award.id);
          return {
            programId: Number(programId),
            awardType: award.id,
          };
        });

        const response = await voteApi({
          userId: authStore.userId!,
          votes: votes,
        });

        // 投票成功，更新本地状态
        authStore.updateVoteStatus(true);

        // 添加投票记录到 authStore，用于回显显示
        const voteRecords = selectedAwards.map((award) => {
          const programId = voteStore.getVotedProgram(award.id);
          const programName = getProgramName(Number(programId));
          return {
            id: Date.now() + Math.random(), // 临时ID
            programId: Number(programId),
            programName: programName,
            awardType: award.id,
            createdAt: new Date().toISOString(),
          };
        });
        voteRecords.forEach((record) => {
          authStore.voteRecords.push(record);
        });

        message.success("投票成功！感谢您的参与");
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

// 是否显示已投票状态（只在用户实际提交投票后显示）
const displayHasVoted = computed(() => authStore.hasVoted);

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

  .program-card {
    padding: 15px;
  }

  .floating-vote-button {
    right: 15px;
    bottom: 15px;
  }
}

// 悬浮投票按钮
.floating-vote-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: pulse 2s infinite;
}

.floating-button-text {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
