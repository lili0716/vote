import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const userInfo = ref({
    name: '',
    employeeId: '',
    department: '',
    vote:false,
    voteInfo:''
  })
  const Login = () => {
    userInfo.value.name = 'John Doe'
    userInfo.value.employeeId = '1234567890'
    userInfo.value.department = 'IT'
    userInfo.value.vote = true
    userInfo.value.voteInfo = '2026-01-23'

  }
  return { userInfo, Login }
})
