import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { TaskModal } from '../../components/tasks/TaskModal'
import type { Task, ActivityLog } from '../../types'
import {
  cn,
  formatDate,
  formatTimeAgo,
  getTaskStatusColor,
  getTaskPriorityColor,
  getUserInitials
} from '../../utils'

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: taskResponse, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => apiService.getTask(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiService.deleteTask(id!),
    onSuccess: () => {
      navigate('/tasks')
    },
  })

  const task = taskResponse?.data as Task & { activityHistory: ActivityLog[] } | undefined
  const canEdit = user?.role === 'admin' ||
    task?.assignee?._id === user?._id ||
    task?.createdBy._id === user?._id
  const canDelete = user?.role === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error || !task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task Not Found</h3>
        <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/tasks')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Tasks
        </button>
      </div>
    )
  }

  const formatChangeValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      if (value.from !== undefined && value.to !== undefined) {
        return `${value.from} → ${value.to}`
      }
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
            <p className="text-gray-600">View and manage task information</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Task
            </button>
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex space-x-2">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  getTaskStatusColor(task.status)
                )}>
                  {task.status.replace('-', ' ')}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  getTaskPriorityColor(task.priority)
                )}>
                  {task.priority}
                </span>
              </div>
            </div>

            {task.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {task.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {task.activityHistory && task.activityHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity History</h3>
              <div className="space-y-4">
                {task.activityHistory.map((activity) => (
                  <div key={activity._id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {activity.user ? (
                          <span className="text-xs font-medium text-gray-600">
                            {getUserInitials(activity.user.firstName, activity.user.lastName)}
                          </span>
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.user
                            ? `${activity.user.firstName} ${activity.user.lastName}`
                            : 'System'
                          }
                        </span>
                        {' '}
                        <span className="text-gray-600">
                          {activity.action === 'created' && 'created this task'}
                          {activity.action === 'updated' && 'updated this task'}
                          {activity.action === 'deleted' && 'deleted this task'}
                          {activity.action === 'status_changed' && 'changed the status'}
                          {activity.action === 'assigned' && 'assigned this task'}
                          {activity.action === 'unassigned' && 'unassigned this task'}
                        </span>
                      </p>
                      {activity.changes && Object.keys(activity.changes).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {Object.entries(activity.changes).map(([key, value]) => (
                            <div key={key}>
                              {key}: {formatChangeValue(value)}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Assignee
                </label>
                {task.assignee ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                      {getUserInitials(task.assignee.firstName, task.assignee.lastName)}
                    </div>
                    <span className="text-sm text-gray-900">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Unassigned</span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date
                </label>
                {task.dueDate ? (
                  <div className={cn(
                    'text-sm',
                    task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'
                  )}>
                    {formatDate(task.dueDate)}
                    {task.isOverdue && (
                      <span className="block text-xs">Overdue</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No due date</span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Created By
                </label>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                    {getUserInitials(task.createdBy.firstName, task.createdBy.lastName)}
                  </div>
                  <span className="text-sm text-gray-900">
                    {task.createdBy.firstName} {task.createdBy.lastName}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Created
                </label>
                <span className="text-sm text-gray-500">
                  {formatDate(task.createdAt)} ({formatTimeAgo(task.createdAt)})
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Last Updated
                </label>
                <span className="text-sm text-gray-500">
                  {formatDate(task.updatedAt)} ({formatTimeAgo(task.updatedAt)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <TaskModal
          mode="edit"
          task={task}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['task', id] })
            setShowEditModal(false)
          }}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 