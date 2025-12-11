'use client'

import { Toast, ToastProps } from './Toast'

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed right-0 top-0 z-50 flex flex-col items-end p-4"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
