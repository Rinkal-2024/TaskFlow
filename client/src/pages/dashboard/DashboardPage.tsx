import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { TaskModal } from '../../components/tasks/TaskModal'
import {
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  Users,
  BarChart3,
  Activity,
  ArrowRight
} from 'lucide-react'
import { cn, formatTimeAgo, getTaskStatusColor, getTaskPriorityColor } from '../../utils'

export const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => apiService.getOverviewStats(),
  })

  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'recent'],
    queryFn: () => apiService.getTasks(undefined, { page: 1, limit: 5 }),
  })

  const { data: systemStats, isLoading: systemLoading } = useQuery({
    queryKey: ['stats', 'system'],
    queryFn: () => apiService.getSystemStats(),
    enabled: user?.role === 'admin',
  })

  console.log(systemStats)
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['stats', 'user'],
    queryFn: () => apiService.getUserStats(),
    enabled: user?.role === 'member',
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const taskStats = stats?.data

  

  const getStatCards = () => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Tasks',
          value: systemStats?.data?.systemMetrics.tasks,
          icon: CheckSquare,
          color: 'text-blue-600 bg-blue-100',
          change: `${taskStats.totalTasks > 0 ? Math.round((taskStats.totalTasks / Math.max(taskStats.totalTasks - 5, 1)) * 100 - 100) : 0}%`,
          changeType: 'positive'
        },
        {
          title: 'Total Users',
          value: systemStats?.data?.systemMetrics.users,
          icon: Users,
          color: 'text-purple-600 bg-purple-100',
          changeType: 'positive'
        },
        {
          title: 'System Health',
          value: systemStats?.data.dataHealth.tasks.completenessScore,
          icon: TrendingUp,
          color: 'text-green-600 bg-green-100',
          changeType: 'positive'
        },
        {
          title: 'Active Sessions',
          value: systemStats?.data?.systemMetrics.recentActivity24h,
          icon: Activity,
          color: 'text-indigo-600 bg-indigo-100',
          changeType: 'positive'
        },
      ]
    } else {
      const completionRate = userStats?.data?.myTasks > 0
        ? Math.round((userStats.data.completedTasks / userStats.data.myTasks) * 100)
        : 0;

      return [
        {
          title: 'My Tasks',
          value: userStats?.data?.myTasks || 0,
          icon: CheckSquare,
          color: 'text-blue-600 bg-blue-100',
          change: `${userStats?.data?.myTasks > 0 ? Math.round((userStats.data.myTasks / Math.max(userStats.data.myTasks - 2, 1)) * 100 - 100) : 0}%`,
          changeType: 'positive'
        },
        {
          title: 'Completed',
          value: userStats?.data?.completedTasks || 0,
          icon: TrendingUp,
          color: 'text-green-600 bg-green-100',
          change: `${completionRate}%`,
          changeType: 'positive'
        },
        {
          title: 'In Progress',
          value: userStats?.data?.inProgressTasks || 0,
          icon: Clock,
          color: 'text-yellow-600 bg-yellow-100',
          change: `${userStats?.data?.inProgressTasks > 0 ? Math.round((userStats.data.inProgressTasks / Math.max(userStats.data.inProgressTasks - 1, 1)) * 100 - 100) : 0}%`,
          changeType: 'positive'
        },
        {
          title: 'Overdue',
          value: userStats?.data?.overdueTasks || 0,
          icon: AlertCircle,
          color: 'text-red-600 bg-red-100',
          change: `${userStats?.data?.overdueTasks > 0 ? Math.round((userStats.data.overdueTasks / Math.max(userStats.data.overdueTasks + 1, 1)) * 100 - 100) : 0}%`,
          changeType: 'negative'
        },
      ]
    }
  }

  const statCards = getStatCards()

  const priorityStats = [
    {
      label: 'Urgent',
      value: taskStats.taskStats.byPriority.urgent,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      label: 'High',
      value: taskStats.taskStats.byPriority.high,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      label: 'Medium',
      value: taskStats.taskStats.byPriority.medium,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Low',
      value: taskStats.taskStats.byPriority.low,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    }
  ]

  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Create Task',
        description: 'Add a new task to your list',
        icon: Plus,
        action: () => setShowCreateModal(true),
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        title: 'View All Tasks',
        description: 'See your complete task list',
        icon: CheckSquare,
        action: () => navigate('/tasks'),
        color: 'bg-green-50 text-green-700 border-green-200'
      }
    ]

    if (user?.role === 'admin') {
      baseActions.push(
        {
          title: 'Manage Users',
          description: 'Add or manage team members',
          icon: Users,
          action: () => navigate('/users'),
          color: 'bg-purple-50 text-purple-700 border-purple-200'
        },
        {
          title: 'System Analytics',
          description: 'View detailed system statistics',
          icon: BarChart3,
          action: () => navigate('/stats'),
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        }
      )
    }

    return baseActions
  }

  const quickActions = getQuickActions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin'
              ? 'Here\'s an overview of your system and team performance.'
              : 'Here\'s what\'s happening with your tasks today.'
            }
          </p>
          {user?.role === 'admin' && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Administrator
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={cn('p-3 rounded-lg', stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-sm font-medium',
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.change}
                </span>
                <p className="text-xs text-gray-500">vs last week</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {user?.role === 'admin' ? 'System Tasks by Priority' : 'My Tasks by Priority'}
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {priorityStats.map((priority) => (
              <div key={priority.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', priority.color)}></div>
                  <span className="text-sm font-medium text-gray-700">{priority.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn('text-sm font-semibold', priority.textColor)}>
                    {priority.value}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full', priority.color)}
                      style={{
                        width: `${taskStats.totalTasks > 0 ? (priority.value / taskStats.totalTasks) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid',
                  action.color
                )}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm opacity-75">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {user?.role === 'admin' ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">System Activity</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            {systemLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Recent Activity (24h)</span>
                  <span className="text-sm font-medium text-blue-600">
                    {systemStats?.data?.systemMetrics?.recentActivity24h || 0} activities
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Activity Logs</span>
                  <span className="text-sm font-medium text-green-600">
                    {systemStats?.data?.systemMetrics?.activityLogs || 0} logs
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Server Uptime</span>
                  <span className="text-sm font-medium text-purple-600">
                    {Math.floor((systemStats?.data?.systemInfo?.serverUptime || 0) / 60)} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Data Health Score</span>
                  <span className="text-sm font-medium text-orange-600">
                    {systemStats?.data?.dataHealth?.tasks?.completenessScore || 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">My Progress</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            {userStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats?.data?.completionRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Task Completion Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-medium">{userStats?.data?.tasksThisWeek || 0} tasks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span className="font-medium">{userStats?.data?.tasksThisMonth || 0} tasks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streak</span>
                    <span className="font-medium">{userStats?.data?.currentStreak || 0} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {user?.role === 'admin' ? 'Recent System Tasks' : 'My Recent Tasks'}
          </h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="p-6">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentTasks?.data?.tasks?.length ? (
            <div className="space-y-4">
              {recentTasks.data.tasks.map((task: any) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-3 -mx-3 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tasks/${task._id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {task.title}
                      </h3>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getTaskStatusColor(task.status)
                      )}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getTaskPriorityColor(task.priority)
                      )}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created {formatTimeAgo(task.createdAt)}
                      {task.assignee && (
                        <span> • Assigned to {task.assignee.firstName} {task.assignee.lastName}</span>
                      )}
                      {user?.role === 'admin' && task.createdBy && (
                        <span> • Created by {task.createdBy.firstName} {task.createdBy.lastName}</span>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'admin'
                  ? 'No tasks have been created yet.'
                  : 'Get started by creating your first task.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <TaskModal
          mode="create"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
} 