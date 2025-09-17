import { useState } from 'react'
import { Search, Filter, X, Calendar, Tag, SortAsc, SortDesc } from 'lucide-react'
import type { TaskFilters, TaskStatus, TaskPriority, UserRole } from '../../types'
import { cn, debounce } from '../../utils'

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  onSearchChange: (search: string) => void
  searchQuery: string
  userRole?: UserRole
  availableTags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export const TaskFiltersComponent = ({
  filters,
  onFiltersChange,
  onSearchChange,
  searchQuery,
  availableTags = [],
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortChange
}: TaskFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  const debouncedSearch = debounce((query: string) => {
    onSearchChange(query)
  }, 300)

  const handleStatusChange = (status: TaskStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    })
  }

  const handlePriorityChange = (priority: TaskPriority) => {
    const currentPriorities = filters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority]
    
    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    })
  }

  const handleTagChange = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    })
  }

  const handleDateRangeChange = () => {
    onFiltersChange({
      ...filters,
      dueDate: dateRange.from || dateRange.to ? {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined
      } : undefined
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onSearchChange('')
    setDateRange({ from: '', to: '' })
  }

  const activeFilterCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.tags?.length,
    filters.dueDate ? 1 : 0,
    filters.isOverdue ? 1 : 0
  ].filter(Boolean).length

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' }
  ]

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ]

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onFiltersChange({ ...filters, isOverdue: !filters.isOverdue })}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md border transition-colors',
              filters.isOverdue
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            Overdue
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors',
              showAdvanced || activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {(activeFilterCount > 0 || searchQuery) && (
            <button
              onClick={clearAllFilters}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </button>
          )}
        </div>

        {/* Sort */}
        {onSortChange && (
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value, sortOrder)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded border border-gray-300"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Status Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-full border transition-colors',
                    filters.status?.includes(status.value)
                      ? status.color
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => handlePriorityChange(priority.value)}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-full border transition-colors',
                    filters.priority?.includes(priority.value)
                      ? priority.color
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-full border transition-colors',
                      filters.tags?.includes(tag)
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="From"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="To"
              />
              <button
                onClick={handleDateRangeChange}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 