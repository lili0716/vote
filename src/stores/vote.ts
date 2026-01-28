import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useVoteStore = defineStore(
  'vote',
  () => {
    // 存储每个奖项对应的节目ID
    const votedPrograms = ref<Record<string, string>>({})

    // 是否已投票（至少为一个奖项投票）
    const hasVoted = computed(() => Object.keys(votedPrograms.value).length > 0)

    // 投票
    function vote(awardId: string, programId: string) {
      votedPrograms.value[awardId] = programId
    }

    // 重置投票
    function resetVote() {
      votedPrograms.value = {}
    }

    // 检查某个奖项是否已投票
    function isAwardVoted(awardId: string) {
      return votedPrograms.value[awardId] !== undefined
    }

    // 获取指定奖项的已投票节目ID
    function getVotedProgram(awardId: string) {
      return votedPrograms.value[awardId]
    }

    // 检查节目是否在其他奖项中已被选择
    function isProgramVotedInOtherAwards(currentAwardId: string, programId: string) {
      for (const [awardId, votedProgramId] of Object.entries(votedPrograms.value)) {
        if (awardId !== currentAwardId && votedProgramId === programId) {
          return true
        }
      }
      return false
    }

    // 检查是否至少为一个奖项投票
    function hasVotedInAnyAward() {
      return Object.keys(votedPrograms.value).length > 0
    }

    return {
      votedPrograms,
      hasVoted,
      vote,
      resetVote,
      isAwardVoted,
      getVotedProgram,
      isProgramVotedInOtherAwards,
      hasVotedInAnyAward,
    }
  },
  {
    persist: {
      key: 'pinia_vote',
      storage: localStorage,
      pick: ['votedPrograms'],
    },
  },
)
