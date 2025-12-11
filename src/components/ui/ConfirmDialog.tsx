'use client'

import { Dialog } from './Dialog'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3">
          <Button
            variant={variant}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelText}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
