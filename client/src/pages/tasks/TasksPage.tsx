import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { TaskModal } from '../../components/tasks/TaskModal'
import type { Task, TaskFilters, TaskStatus, TaskPriority, PaginationParams } from '../../types'
import {
  cn,
  formatDate,
  formatTimeAgo,
  getTaskStatusColor,
  getTaskPriorityColor,
  debounce
} from '../../utils'

export const TasksPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<TaskFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '5')
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const search = searchParams.get('search') || ''

    setPagination(prev => (page !== prev.page || limit !== prev.limit) ? { ...prev, page, limit } : prev)
    if (search !== searchQuery) {
      setSearchQuery(search)
      setFilters(prev => ({ ...prev, search: search || undefined }))
    }
  }, [searchParams])

  const updateURL = (newPagination: PaginationParams, newFilters: TaskFilters) => {
    const params = new URLSearchParams()
    params.set('page', newPagination.page.toString())
    params.set('limit', newPagination.limit.toString())
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.status?.length) params.set('status', newFilters.status.join(','))
    if (newFilters.priority?.length) params.set('priority', newFilters.priority.join(','))
    if (newFilters.assignee?.length) params.set('assignee', newFilters.assignee.join(','))
    setSearchParams(params)
  }

  const debouncedSearch = debounce((query: string) => {
    const newFilters = { ...filters, search: query || undefined }
    const newPagination = { ...pagination, page: 1 }
    setFilters(newFilters)
    setPagination(newPagination)
    updateURL(newPagination, newFilters)
  }, 300)

  const effectiveFilters = user?.role === 'member'
    ? { ...filters, assignee: [user._id] }
    : filters

  const { data: tasksResponse, isLoading, error } = useQuery({
    queryKey: ['tasks', effectiveFilters, pagination],
    queryFn: () => {
      return apiService.getTasks(effectiveFilters, pagination)
    },
  })

  useEffect(() => {
    if (tasksResponse) {
    }
  }, [tasksResponse])

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => apiService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowDeleteModal(false)
      setSelectedTask(null)
    },
  })

  const quickStatusChangeMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiService.updateTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    quickStatusChangeMutation.mutate({ taskId, status: newStatus })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  const handleStatusFilter = (status?: TaskStatus) => {
    const newFilters = { ...filters, status: status ? [status] : undefined }
    const newPagination = { ...pagination, page: 1 }
    setFilters(newFilters)
    setPagination(newPagination)
    updateURL(newPagination, newFilters)
  }

  const handlePriorityFilter = (priority?: TaskPriority) => {
    const newFilters = { ...filters, priority: priority ? [priority] : undefined }
    const newPagination = { ...pagination, page: 1 }
    setFilters(newFilters)
    setPagination(newPagination)
    updateURL(newPagination, newFilters)
  }

  const clearFilters = () => {
    const newFilters = {}
    const newPagination = { page: 1, limit: pagination.limit }
    setSearchQuery('')
    setPagination(newPagination)
    updateURL(newPagination, newFilters)
  }

  const tasks = tasksResponse?.data?.tasks || []
  const totalItems = tasksResponse?.pagination?.totalItems || tasks.length
  const totalPages = tasksResponse?.pagination?.totalPages || Math.ceil(totalItems / pagination.limit)

  if (isLoading && !tasks.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Manage and organize all team tasks' : 'Manage and organize your assigned tasks'}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            Total: {totalItems} tasks | Page {pagination.page} of {totalPages}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" /> New Task
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => handleStatusFilter(e.target.value as TaskStatus || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filters.priority?.[0] || ''}
            onChange={(e) => handlePriorityFilter(e.target.value as TaskPriority || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {(filters.status || filters.priority || filters.search) && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Clear Filters</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load tasks. Please try again.</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No tasks found.</p>
            <button onClick={() => setShowCreateModal(true)} className="mt-2 text-blue-600 hover:text-blue-700">
              Create your first task
            </button>
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Task', 'Status', 'Priority', 'Assignee', 'Due Date', 'Updated', 'Actions'].map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task: any) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{tag}</span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleQuickStatusChange(task._id, e.target.value as TaskStatus)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn('px-2 py-1 text-xs font-medium rounded-full border cursor-pointer', getTaskStatusColor(task.status))}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      {task.status === 'done' && (
                        <div className="text-xs text-green-600 mt-1">
                          Completed {formatTimeAgo(task.updatedAt)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', getTaskPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignee ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                            {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                          </div>
                          <div className="ml-2 text-sm font-medium text-gray-900">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.dueDate ? (
                        <div className={cn(task.isOverdue && 'text-red-600 font-medium')}>
                          {formatDate(task.dueDate)}
                          {task.isOverdue && <span className="block text-xs">Overdue</span>}
                        </div>
                      ) : (
                        <span className="text-gray-500">No due date</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimeAgo(task.updatedAt)}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(user?.role === 'admin' ||
                        (task.assignee && task.assignee._id === user?._id) ||
                        (task.createdBy && task.createdBy._id === user?._id)) && (
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTask(selectedTask?._id === task._id ? null : task)
                              }}
                              className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {selectedTask?._id === task._id && (
                              <div
                                className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/tasks/${task._id}`)
                                      setSelectedTask(null)
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowEditModal(true)
                                      setSelectedTask(null)
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit Task
                                  </button>
                                  {user?.role === 'admin' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDeleteModal(true)
                                        setSelectedTask(null)
                                      }}
                                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete Task
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newPagination = { ...pagination, limit: parseInt(e.target.value), page: 1 }
                  setPagination(newPagination)
                  updateURL(newPagination, filters)
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalItems)} of {totalItems} results
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newPagination = { ...pagination, page: 1 }
                    setPagination(newPagination)
                    updateURL(newPagination, filters)
                  }}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="First page"
                >
                  «
                </button>

                <button
                  onClick={() => {
                    const newPagination = { ...pagination, page: Math.max(1, pagination.page - 1) }
                    setPagination(newPagination)
                    updateURL(newPagination, filters)
                  }}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Previous page"
                >
                  ‹
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          const newPagination = { ...pagination, page: pageNum }
                          setPagination(newPagination)
                          updateURL(newPagination, filters)
                        }}
                        className={cn(
                          'px-3 py-1 text-sm border rounded-md',
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-sm text-gray-700">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pagination.page}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        const newPagination = { ...pagination, page }
                        setPagination(newPagination)
                        updateURL(newPagination, filters)
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages) {
                          const newPagination = { ...pagination, page }
                          setPagination(newPagination)
                          updateURL(newPagination, filters)
                        }
                      }
                    }}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">of {totalPages}</span>
                </div>

                <button
                  onClick={() => {
                    const newPagination = { ...pagination, page: Math.min(totalPages, pagination.page + 1) }
                    setPagination(newPagination)
                    updateURL(newPagination, filters)
                  }}
                  disabled={pagination.page === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Next page"
                >
                  ›
                </button>

                <button
                  onClick={() => {
                    const newPagination = { ...pagination, page: totalPages }
                    setPagination(newPagination)
                    updateURL(newPagination, filters)
                  }}
                  disabled={pagination.page === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Last page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showCreateModal && (
        <TaskModal mode="create" isOpen onClose={() => setShowCreateModal(false)} onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          setShowCreateModal(false)
        }} />
      )}
      {showEditModal && selectedTask && (
        <TaskModal mode="edit" task={selectedTask} isOpen onClose={() => {
          setShowEditModal(false)
          setSelectedTask(null)
        }} onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          setShowEditModal(false)
          setSelectedTask(null)
        }} />
      )}
      {showDeleteModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
          <div className="relative top-20 mx-auto p-5 w-96 border rounded-md bg-white shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{selectedTask.title}"? This action cannot be undone.
            </p>
            <div className="mt-4 flex space-x-3 justify-center">
              <button onClick={() => {
                setShowDeleteModal(false)
                setSelectedTask(null)
              }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
              <button onClick={() => deleteMutation.mutate(selectedTask._id)}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}