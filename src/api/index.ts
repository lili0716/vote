import { post, get } from '../utils/https'

// 登录接口
export interface LoginParams {
  employeeId: string // 工号
}

export interface VoteRecord {
  id: number
  programId: number
  programName: string | null
  awardType: string
  createdAt: string
}

export interface LoginResponse {
  token?: string
  message?: string
  user?: {
    id: number
    name: string
    employeeId: string
    role: string
    hasVoted: boolean
  }
  voteRecords?: VoteRecord[]
  [key: string]: any
}

// 登录
export const loginApi = (params: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>('/login', params)
}

// 投票接口
export interface VoteParams {
  userId: number // 用户ID
  votes: Array<{
    programId: number // 节目ID
    awardType: string // 投票奖项类型 (bestProgram, bestPerformance, bestCreativity)
  }>
}

export interface VoteResponse {
  success?: boolean
  message?: string
  [key: string]: any
}

// 投票
export const voteApi = (params: VoteParams): Promise<VoteResponse> => {
  return post<VoteResponse>('/vote/submit', params)
}

// 获取节目列表
export interface ProgramResponse {
  message?: string
  programs?: Array<{
    id: number
    name: string
    bestProgram: number
    bestPerformance: number
    bestCreativity: number
    createdAt: string
    updatedAt: string
  }>
  [key: string]: any
}

// 获取节目列表
export const getProgramsApi = (): Promise<ProgramResponse> => {
  return get<ProgramResponse>('/vote/programs')
}

// 获取投票结果（仅root账户可访问）
export interface VoteResultResponse {
  message?: string
  statistics?: {
    votedUsers: number
    totalUsers: number
    votingRate: string
  }
  programs?: Array<{
    id: number
    name: string
    bestProgram: number
    bestPerformance: number
    bestCreativity: number
    createdAt: string
    updatedAt: string
  }>
  winners?: {
    bestProgram: Array<any>
    bestPerformance: Array<any>
    bestCreativity: Array<any>
  }
  [key: string]: any
}

// 获取投票结果
export const getVoteResultsApi = (): Promise<VoteResultResponse> => {
  return get<VoteResultResponse>('/admin/results')
}

// 同步用户信息接口
export interface SyncUsersParams {
  remoteDBConfig: {
    host: string // 远程数据库IP
    user: string // 数据库用户名
    password: string // 数据库密码
    database: string // 数据库名
  }
  tableName: string // 远程数据库表名
  filterField?: string // 筛选字段名
  filterValue?: string | number // 筛选字段值
}

export interface SyncUsersResponse {
  message?: string
  results?: {
    total: number
    success: number
    failed: number
    syncedUsers: Array<{
      id: number
      name: string
      employeeId: string
      created: boolean
    }>
  }
  error?: string
  [key: string]: any
}

// 同步用户信息
export const syncUsersApi = (params: SyncUsersParams): Promise<SyncUsersResponse> => {
  return post<SyncUsersResponse>('/sync/users', params)
}
