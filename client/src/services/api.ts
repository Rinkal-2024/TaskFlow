import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse 
} from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  BackendPaginatedResponse,
  User,
  Task,
  LoginForm,
  RegisterForm,
  TaskForm,
  UserUpdateForm,
  PasswordChangeForm,
  TaskFilters,
  UserFilters,
  PaginationParams,
  TaskStats,
  UserStats,
  SystemStats,
  ActivityLog
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.request<T>(config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const errorMessages = error.response.data.errors.map((err: any) => err.msg || err.message).join(', ');
      return new Error(errorMessages);
    }
    if (error.response?.data?.validationErrors) {
      const errorMessages = Object.values(error.response.data.validationErrors).join(', ');
      return new Error(errorMessages);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<ApiResponse<{ user: User; token: string }>>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    });

    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<ApiResponse<{ user: User; token: string }>>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    });

    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>({
        method: 'POST',
        url: '/auth/logout',
      });
      localStorage.removeItem('token');
      return response;
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'GET',
      url: '/auth/profile',
    });
  }

  async updateProfile(userData: UserUpdateForm): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'PATCH',
      url: '/auth/profile',
      data: userData,
    });
  }

  async changePassword(passwords: PasswordChangeForm): Promise<ApiResponse> {
    return this.request<ApiResponse>({
      method: 'POST',
      url: '/auth/change-password',
      data: passwords,
    });
  }

  async verifyToken(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'GET',
      url: '/auth/verify',
    });
  }

  async getTasks(
    filters?: TaskFilters,
    pagination?: PaginationParams
  ): Promise<BackendPaginatedResponse<Task>> {
    const params = new URLSearchParams();
    
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (nestedValue) {
                params.append(`${key}.${nestedKey}`, nestedValue.toString());
              }
            });
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request<BackendPaginatedResponse<Task>>({
      method: 'GET',
      url: `/tasks?${params.toString()}`,
    });
  }

  async getTask(id: string): Promise<ApiResponse<Task & { activityHistory: ActivityLog[] }>> {
    return this.request<ApiResponse<Task & { activityHistory: ActivityLog[] }>>({
      method: 'GET',
      url: `/tasks/${id}`,
    });
  }

  async createTask(taskData: TaskForm): Promise<ApiResponse<Task>> {
    return this.request<ApiResponse<Task>>({
      method: 'POST',
      url: '/tasks',
      data: taskData,
    });
  }

  async updateTask(id: string, taskData: Partial<TaskForm>): Promise<ApiResponse<Task>> {
    return this.request<ApiResponse<Task>>({
      method: 'PATCH',
      url: `/tasks/${id}`,
      data: taskData,
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>({
      method: 'DELETE',
      url: `/tasks/${id}`,
    });
  }

  async getOverdueTasks(): Promise<ApiResponse<Task[]>> {
    return this.request<ApiResponse<Task[]>>({
      method: 'GET',
      url: '/tasks/overdue',
    });
  }

  async getTasksByAssignee(assigneeId: string): Promise<ApiResponse<Task[]>> {
    return this.request<ApiResponse<Task[]>>({
      method: 'GET',
      url: `/tasks/assignee/${assigneeId}`,
    });
  }

  async bulkUpdateTasks(
    taskIds: string[],
    updates: Partial<TaskForm>
  ): Promise<ApiResponse<{ updated: number }>> {
    return this.request<ApiResponse<{ updated: number }>>({
      method: 'PATCH',
      url: '/tasks/bulk',
      data: { taskIds, updates },
    });
  }

  async getUsers(
    filters?: UserFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    return this.request<PaginatedResponse<User>>({
      method: 'GET',
      url: `/users?${params.toString()}`,
    });
  }

  async getUser(id: string): Promise<ApiResponse<User & { taskStats: any }>> {
    return this.request<ApiResponse<User & { taskStats: any }>>({
      method: 'GET',
      url: `/users/${id}`,
    });
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>({
      method: 'PATCH',
      url: `/users/${id}/role`,
      data: { role },
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>({
      method: 'DELETE',
      url: `/users/${id}`,
    });
  }

  async getUserDashboard(id?: string): Promise<ApiResponse<any>> {
    const url = id ? `/users/dashboard/${id}` : '/users/dashboard';
    return this.request<ApiResponse<any>>({
      method: 'GET',
      url,
    });
  }

  async getOverviewStats(): Promise<ApiResponse<TaskStats>> {
    return this.request<ApiResponse<TaskStats>>({
      method: 'GET',
      url: '/stats/overview',
    });
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>({
      method: 'GET',
      url: '/stats/analytics',
    });
  }

  async getTeamStats(): Promise<ApiResponse<UserStats>> {
    return this.request<ApiResponse<UserStats>>({
      method: 'GET',
      url: '/stats/team',
    });
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return this.request<ApiResponse<SystemStats>>({
      method: 'GET',
      url: '/stats/system',
    });
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>({
      method: 'GET',
      url: '/stats/user',
    });
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.request<ApiResponse>({
      method: 'GET',
      url: '/health',
    });
  }
}

const apiService = new ApiService();
export default apiService; 