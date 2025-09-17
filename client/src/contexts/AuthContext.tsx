import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AuthContextType,
  User,
  LoginForm,
  RegisterForm,
  UserUpdateForm,
  PasswordChangeForm,
} from '../types';
import apiService from '../services/api';
import { getErrorMessage } from '../utils';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: authData,
    isLoading: isLoadingAuth,
    error: authError,
  } = useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: () => apiService.verifyToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('token'),
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginForm) => apiService.login(credentials),
    onSuccess: (response: any) => {
      if (response.data?.user) {
        setUser(response.data.user);
        queryClient.setQueryData(['auth', 'verify'], { data: response.data.user });
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: any) => {
      console.error('Login failed:', getErrorMessage(error));
      throw error;
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterForm) => apiService.register(userData),
    onSuccess: (response: any) => {
      if (response.data?.user) {
        setUser(response.data.user);
        queryClient.setQueryData(['auth', 'verify'], { data: response.data.user });
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: any) => {
      console.error('Registration failed:', getErrorMessage(error));
      throw error;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (userData: UserUpdateForm) => apiService.updateProfile(userData),
    onSuccess: (response: any) => {
      if (response.data) {
        setUser(response.data);
        queryClient.setQueryData(['auth', 'verify'], { data: response.data });
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: any) => {
      console.error('Profile update failed:', getErrorMessage(error));
      throw error;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (passwords: PasswordChangeForm) => apiService.changePassword(passwords),
    onError: (error: any) => {
      console.log(error);
      console.error('Password change failed:', getErrorMessage(error));
      throw error;
    },
  });

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', getErrorMessage(error));
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      if (authData?.data && !authError) {
        setUser(authData.data);
      } else {
        setUser(null);
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
        }
      }
      setIsInitialized(true);
    }
  }, [authData, authError, isLoadingAuth]);

  const login = async (credentials: LoginForm): Promise<void> => {
    try {
      await loginMutation.mutateAsync(credentials);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const register = async (userData: RegisterForm): Promise<void> => {
    try {
      await registerMutation.mutateAsync(userData);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const updateProfile = async (userData: UserUpdateForm): Promise<void> => {
    try {
      await updateProfileMutation.mutateAsync(userData);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const changePassword = async (passwords: PasswordChangeForm): Promise<void> => {
    try {
      await changePasswordMutation.mutateAsync(passwords);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoadingAuth || !isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 