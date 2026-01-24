// src/utils/request.ts
import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosInstance, type AxiosProgressEvent } from 'axios';

// 创建 axios 实例
const https: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量读取基础 URL
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
https.interceptors.request.use(
  (config:any) => {
    // 从 Pinia store 获取 token
    // 注意：这里需要动态获取，因为 Pinia store 可能在模块加载时还未初始化
    try {
      const authData = localStorage.getItem('pinia_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('获取 token 失败:', error);
    }
    return config;
  },
  (error:any) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
https.interceptors.response.use(
  (response: AxiosResponse) => {
    // 根据后端数据结构调整，比如只返回 data 部分
    return response.data;
  },
  (error:any) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 例如跳转登录页
      console.warn('未授权，请重新登录');
    }
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return https.get(url, { params, ...config });
}

// 封装 POST 请求（默认 application/json）
export function post<T = any>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return https.post(url, data, config);
}

// 封装文件上传（multipart/form-data）
export function upload<T = any>(
  url: string,
  file: File | Blob,
  fileName = 'file',
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  config?: AxiosRequestConfig
): Promise<T> {
  const formData = new FormData();
  formData.append(fileName, file);

  return https.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
    ...config,
  });
}

// 通用请求方法（支持 put、delete、patch 等）
export function request<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  return https(config);
}

// 导出实例，供高级使用
export default https;