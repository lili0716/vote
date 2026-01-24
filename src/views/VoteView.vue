<template>
  <div class="vote-container">
    <!-- 顶部图片区域 -->
    <div class="header-image">
      <img :src="headerImage" alt="投票活动" class="header-img" />
      <div class="image-upload-overlay">
        <n-upload
          :file-list="[]"
          :max="1"
          accept="image/*"
          :show-file-list="false"
          @change="handleImageChange"
        >
          <n-button quaternary type="error" size="small">
            📷 更换图片
          </n-button>
        </n-upload>
      </div>
    </div>

    <!-- 投票说明 -->
    <div class="vote-notice">
      <n-alert type="warning" :bordered="false">
        <template #header>
          ⚠️ 投票规则
        </template>
        您只能选择一个奖项进行投票，一旦投票后将无法更改
      </n-alert>
    </div>

    <!-- 投票状态提示 -->
    <div v-if="voteStore.hasVoted" class="vote-status">
      <n-alert type="success" :bordered="false">
        <template #header>
          ✅ 已投票
        </template>
        您已为 <strong>{{ getVotedAwardName() }}</strong> 投票，选择的节目是 <strong>{{ getVotedProgramName() }}</strong>
      </n-alert>
    </div>

    <!-- 奖项列表 -->
    <div class="awards-container">
      <div
        v-for="award in awards"
        :key="award.id"
        class="award-card"
        :class="{ 'award-voted': voteStore.isAwardVoted(award.id), 'award-disabled': voteStore.hasVoted && !voteStore.isAwardVoted(award.id) }"
      >
        <div class="award-header">
          <div class="award-icon">
            <span class="award-emoji">{{ award.icon }}</span>
          </div>
          <h2 class="award-title">{{ award.name }}</h2>
          <div v-if="voteStore.isAwardVoted(award.id)" class="voted-badge">
            ✅ 已投票
          </div>
        </div>

        <div class="programs-grid">
          <div
            v-for="program in programs"
            :key="program.id"
            class="program-card"
            :class="{
              'program-selected': voteStore.isAwardVoted(award.id) && voteStore.votedProgramId === program.id,
              'program-disabled': voteStore.hasVoted && (voteStore.votedProgramId !== program.id || !voteStore.isAwardVoted(award.id)),
            }"
            @click="handleVote(award.id, program.id)"
          >
            <div class="program-number">{{ program.id }}</div>
            <div class="program-name">{{ program.name }}</div>
            <div v-if="voteStore.isAwardVoted(award.id) && voteStore.votedProgramId === program.id" class="selected-mark">
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  NButton,
  NUpload,
  NAlert,
} from 'naive-ui'
import { useVoteStore } from '../stores/vote'
import { voteApi } from '../api'

const message = useMessage()
const dialog = useDialog()
const voteStore = useVoteStore()
const voting = ref(false)

// 顶部图片（默认使用喜庆图片，可替换）
const headerImage = ref('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=400&fit=crop')

// 奖项列表
const awards = [
  { id: 'award1', name: '最佳创意奖', icon: '🎨' },
  { id: 'award2', name: '最佳团队奖', icon: '👥' },
  { id: 'award3', name: '最具氛围奖', icon: '🎉' },
]

// 节目列表（所有奖项共用）
const programs = ref([
  { id: '1', name: '节目一' },
  { id: '2', name: '节目二' },
  { id: '3', name: '节目三' },
  { id: '4', name: '节目四' },
  { id: '5', name: '节目五' },
  { id: '6', name: '节目六' },
])

// 处理图片更换
const handleImageChange = (options: { fileList: any[] }) => {
  const file = options.fileList?.[0]?.file
  if (file && file instanceof File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        headerImage.value = e.target.result as string
        message.success('图片更换成功！')
      }
    }
    reader.onerror = () => {
      message.error('图片读取失败，请重试')
    }
    reader.readAsDataURL(file)
  }
}

// 处理投票
const handleVote = (awardId: string, programId: string) => {
  // 如果已投票，不允许再投票
  if (voteStore.hasVoted) {
    message.warning('您已经投票，无法再次投票！')
    return
  }

  // 如果正在投票中，不允许重复点击
  if (voting.value) {
    return
  }

  // 显示确认弹窗
  const awardName = getAwardName(awardId)
  const programName = getProgramName(programId)

  dialog.warning({
    title: '确认投票',
    content: `您确定要为"${awardName}"投票，选择的节目是"${programName}"吗？投票后将无法更改。`,
    positiveText: '确认投票',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 确认投票，调用后端接口
      voting.value = true
      try {
        const response = await voteApi({
          programId: programId,
          awardType: awardId, // award1, award2, award3
        })

        // 投票成功，更新本地状态
        voteStore.vote(awardId, programId)
        message.success(`投票成功！您已为"${awardName}"投票，选择的节目是"${programName}"`)
      } catch (error: any) {
        // 处理投票失败
        const errorMessage = error?.response?.data?.message || error?.message || '投票失败，请重试'
        message.error(errorMessage)
      } finally {
        voting.value = false
      }
    },
    onNegativeClick: () => {
      // 取消投票
      message.info('已取消投票')
    },
  })
}

// 获取奖项名称
const getAwardName = (awardId: string) => {
  return awards.find(a => a.id === awardId)?.name || ''
}

// 获取节目名称
const getProgramName = (programId: string) => {
  return programs.value.find(p => p.id === programId)?.name || ''
}

// 获取已投票的奖项名称
const getVotedAwardName = () => {
  if (!voteStore.votedAwardId) return ''
  return getAwardName(voteStore.votedAwardId)
}

// 获取已投票的节目名称
const getVotedProgramName = () => {
  if (!voteStore.votedProgramId) return ''
  return getProgramName(voteStore.votedProgramId)
}

// 初始化：可以从API加载节目列表
onMounted(() => {
  // 这里可以调用API获取节目列表
  // 示例：programs.value = await fetchPrograms()
})
</script>

<style scoped lang="scss">
.vote-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%);
  padding-bottom: 40px;
}

// 顶部图片区域
.header-image {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  margin-bottom: 20px;

  .header-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-upload-overlay {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 12px;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }
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
