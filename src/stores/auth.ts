import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useVoteStore } from './vote'

export interface VoteRecord {
  id: number
  programId: number
  programName: string | null
  awardType: string
  createdAt: string
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string | null>(null)
    const username = ref('')
    const userId = ref<number | null>(null)
    const userRole = ref<string>('user')
    const hasVoted = ref(false)
    const voteRecords = ref<VoteRecord[]>([])

    const isLoggedIn = computed(
      () => typeof token.value === 'string' && token.value.trim().length > 0,
    )
    const isAdmin = computed(() => userRole.value === 'admin')

    function login(
      name: string,
      authToken?: string,
      userData?: { id?: number; role?: string; hasVoted?: boolean },
      voteRecordData?: VoteRecord[],
    ) {
      const voteStore = useVoteStore()
      voteStore.resetVote()
      token.value = authToken || `mock_token_${Date.now()}`
      username.value = name

      if (userData) {
        if (userData.id !== undefined) userId.value = userData.id
        if (userData.role) userRole.value = userData.role
        if (userData.hasVoted !== undefined) hasVoted.value = userData.hasVoted
      }

      if (voteRecordData) {
        voteRecords.value = voteRecordData
        for (const record of voteRecordData) {
          voteStore.vote(record.awardType, String(record.programId))
        }
      }
    }

    function updateVoteStatus(voted: boolean) {
      hasVoted.value = voted
    }

    function logout() {
      const voteStore = useVoteStore()
      voteStore.resetVote()
      localStorage.removeItem('pinia_vote')
      token.value = null
      username.value = ''
      userId.value = null
      userRole.value = 'user'
      hasVoted.value = false
      voteRecords.value = []
    }

    return {
      token,
      username,
      userId,
      userRole,
      hasVoted,
      voteRecords,
      isLoggedIn,
      isAdmin,
      login,
      updateVoteStatus,
      logout,
    }
  },
  {
    persist: {
      key: 'pinia_auth',
      storage: localStorage,
      pick: ['token', 'username', 'userId', 'userRole', 'hasVoted', 'voteRecords'],
    },
  },
)
