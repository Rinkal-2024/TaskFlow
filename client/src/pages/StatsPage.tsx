import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  BarChart3,
  Users,
  CheckSquare,
  TrendingUp,
  Activity,
  ArrowLeft,
  Calendar,
  Target
} from 'lucide-react'
import { cn, formatTimeAgo } from '../utils'

export const StatsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: systemStats, isLoading: systemLoading } = useQuery({
    queryKey: ['stats', 'system'],
    queryFn: () => apiService.getSystemStats(),
  })

  const { data: teamStats, isLoading: teamLoading } = useQuery({
    queryKey: ['stats', 'team'],
    queryFn: () => apiService.getTeamStats(),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['stats', 'analytics'],
    queryFn: () => apiService.getAnalytics(),
  })

  if (user?.role !== 'admin') {
    navigate('/dashboard')
    return null
  }

  if (systemLoading || teamLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const systemData = systemStats?.data || {}
  const teamData = teamStats?.data || {}
  const analyticsData = analytics?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
            <p className="text-gray-600">Comprehensive overview of system performance and team metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Administrator
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{systemData.systemMetrics?.users || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{systemData.systemMetrics?.tasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Activity className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activity Logs</p>
              <p className="text-2xl font-bold text-gray-900">{systemData.systemMetrics?.activityLogs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
              <Target className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Health</p>
              <p className="text-2xl font-bold text-gray-900">{systemData.dataHealth?.tasks?.completenessScore || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{teamData.teamSummary?.totalMembers || 0}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{teamData.teamSummary?.avgCompletionRate || 0}%</div>
                <div className="text-sm text-gray-600">Avg Completion</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{teamData.teamSummary?.totalOverdueTasks || 0}</div>
                <div className="div text-sm text-gray-600">Overdue Tasks</div>
              </div>
            </div>

            {teamData.userPerformance?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Top Performers</h4>
                {teamData.userPerformance.slice(0, 5).map((user: any, index: number) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                        index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user.completionRate}%</p>
                      <p className="text-sm text-gray-600">{user.completedTasks}/{user.totalTasks} tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Server Uptime</span>
                <span className="font-medium">
                  {Math.floor((systemData.systemInfo?.serverUptime || 0) / 3600)}h {Math.floor(((systemData.systemInfo?.serverUptime || 0) % 3600) / 60)}m
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Recent Activity (24h)</span>
                <span className="font-medium">{systemData.systemMetrics?.recentActivity24h || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Oldest Task</span>
                <span className="font-medium">
                  {systemData.systemInfo?.oldestTaskDate ? formatTimeAgo(systemData.systemInfo.oldestTaskDate) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Newest Task</span>
                <span className="font-medium">
                  {systemData.systemInfo?.newestTaskDate ? formatTimeAgo(systemData.systemInfo.newestTaskDate) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Data Quality Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasks with Due Dates</span>
                  <span className="font-medium">{systemData.dataHealth?.tasks?.withDueDate || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasks with Tags</span>
                  <span className="font-medium">{systemData.dataHealth?.tasks?.withTags || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasks with Descriptions</span>
                  <span className="font-medium">{systemData.dataHealth?.tasks?.withDescription || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Activity Summary (Last 30 Days)</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        {teamData.activitySummary?.last30Days ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(teamData.activitySummary.last30Days).map(([action, count]) => (
              <div key={action} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                <div className="text-sm text-gray-600 capitalize">{action.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No activity data available</p>
        )}
      </div>

      {analyticsData.tagDistribution && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Task Tags</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analyticsData.tagDistribution.slice(0, 10).map((tag: any) => (
              <div key={tag._id} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{tag.count}</div>
                <div className="text-sm text-gray-600">{tag._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 