import { post } from '../utils/https'

// 登录接口
export interface LoginParams {
  employeeId: string // 工号
}

export interface LoginResponse {
  token?: string
  [key: string]: any
}

// 登录
export const loginApi = (params: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>('/login', params)
}

// 投票接口
export interface VoteParams {
  programId: string // 节目号
  awardType: string // 投票奖项类型 (award1, award2, award3)
}

export interface VoteResponse {
  success?: boolean
  message?: string
  [key: string]: any
}

// 投票
export const voteApi = (params: VoteParams): Promise<VoteResponse> => {
  return post<VoteResponse>('/vote', params)
}
