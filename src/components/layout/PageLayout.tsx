import Link from 'next/link'
import { ReactNode } from 'react'

// ============================================================================
// PageContainer - Main wrapper for all admin pages
// ============================================================================
interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className="p-8">{children}</div>
}

// ============================================================================
// PageHeader - Standardized page header with title, description, and actions
// ============================================================================
interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-8 flex items-center justify-between ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ============================================================================
// PageSection - Consistent spacing for page sections
// ============================================================================
interface PageSectionProps {
  children: ReactNode
  className?: string
}

export function PageSection({ children, className = '' }: PageSectionProps) {
  return <div className={`mb-6 ${className}`}>{children}</div>
}

// ============================================================================
// ErrorMessage - Standardized error display
// ============================================================================
interface ErrorMessageProps {
  title?: string
  message: string
  className?: string
}

export function ErrorMessage({ title = 'Error', message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-lg bg-red-50 p-4 text-red-800 ${className}`}>
      <p className="font-medium">{title}</p>
      <p>{message}</p>
    </div>
  )
}

// ============================================================================
// InfoMessage - Standardized info/note display
// ============================================================================
interface InfoMessageProps {
  children: ReactNode
  variant?: 'info' | 'warning' | 'success'
  className?: string
}

export function InfoMessage({ children, variant = 'info', className = '' }: InfoMessageProps) {
  const variantStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    success: 'border-green-200 bg-green-50 text-green-800',
  }

  return (
    <div className={`rounded-lg border p-4 text-sm ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// Breadcrumb - Standardized breadcrumb navigation
// ============================================================================
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`mb-6 text-sm ${className}`}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="text-mvm-blue hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600">{item.label}</span>
            )}
            {index < items.length - 1 && <span className="text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ============================================================================
// FormContainer - Consistent max-width wrapper for forms
// ============================================================================
interface FormContainerProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full'
  className?: string
}

export function FormContainer({
  children,
  maxWidth = 'full',
  className = '',
}: FormContainerProps) {
  const maxWidthClass = maxWidth === 'full' ? 'w-full' : `max-w-${maxWidth}`
  return <div className={`${maxWidthClass} ${className}`}>{children}</div>
}

// ============================================================================
// LoadingState - Standardized loading skeleton
// ============================================================================
interface LoadingStateProps {
  lines?: number
  className?: string
}

export function LoadingState({ lines = 3, className = '' }: LoadingStateProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  )
}

// ============================================================================
// EmptyState - Standardized empty state display
// ============================================================================
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon && <div className="mb-4 text-6xl opacity-50">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
