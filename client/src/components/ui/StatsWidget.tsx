import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils'

interface StatsWidgetProps {
  title: string
  value: number | string
  icon: LucideIcon
  color?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  description?: string
  onClick?: () => void
}

export const StatsWidget = ({
  title,
  value,
  icon: Icon,
  color = 'text-blue-600 bg-blue-100',
  change,
  changeType = 'neutral',
  description,
  onClick
}: StatsWidgetProps) => {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg shadow p-6 border border-gray-200 transition-all duration-200',
        onClick && 'hover:shadow-md hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn('p-3 rounded-lg', color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {change && (
          <div className="text-right">
            <span className={cn(
              'text-sm font-medium',
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            )}>
              {change}
            </span>
            <p className="text-xs text-gray-500">vs last week</p>
          </div>
        )}
      </div>
    </Component>
  )
} 