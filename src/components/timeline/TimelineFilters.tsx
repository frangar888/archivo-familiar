'use client'

import { cn } from '@/lib/utils'
import type { CategoriaEvento } from '@/types'
import { Globe, Ship, Flag, Heart } from 'lucide-react'

interface TimelineFiltersProps {
  activeFilter: CategoriaEvento | null
  onFilterChange: (filter: CategoriaEvento | null) => void
  counts: Record<CategoriaEvento | 'all', number>
}

const filters: {
  value: CategoriaEvento | null
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}[] = [
  { value: null, label: 'Todos', icon: Globe, color: 'bg-outline' },
  { value: 'espana', label: 'España', icon: Globe, color: 'bg-secondary' },
  { value: 'travesia', label: 'Travesía', icon: Ship, color: 'bg-tertiary' },
  { value: 'argentina', label: 'Argentina', icon: Flag, color: 'bg-primary' },
  { value: 'familia', label: 'Familia', icon: Heart, color: 'bg-primary-container' },
]

export function TimelineFilters({
  activeFilter,
  onFilterChange,
  counts,
}: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.value
        const count = filter.value === null ? counts.all : counts[filter.value]

        return (
          <button
            key={filter.value ?? 'all'}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'text-label-lg transition-all duration-200',
              isActive
                ? 'bg-primary text-white shadow-button'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-body-sm',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-container text-outline'
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
