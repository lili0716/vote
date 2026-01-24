import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useVoteStore = defineStore(
  'vote',
  () => {
    // 已投票的奖项ID（null表示未投票）
    const votedAwardId = ref<string | null>(null)
    // 已投票的节目ID
    const votedProgramId = ref<string | null>(null)

    // 是否已投票
    const hasVoted = computed(() => votedAwardId.value !== null)

    // 投票
    function vote(awardId: string, programId: string) {
      votedAwardId.value = awardId
      votedProgramId.value = programId
    }

    // 重置投票
    function resetVote() {
      votedAwardId.value = null
      votedProgramId.value = null
    }

    // 检查某个奖项是否已投票
    function isAwardVoted(awardId: string) {
      return votedAwardId.value === awardId
    }

    return {
      votedAwardId,
      votedProgramId,
      hasVoted,
      vote,
      resetVote,
      isAwardVoted,
    }
  },
  {
    persist: {
      key: 'pinia_vote',
      storage: localStorage,
      pick: ['votedAwardId', 'votedProgramId'],
    },
  }
)
