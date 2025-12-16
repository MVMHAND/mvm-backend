'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import { uploadAvatarAction } from '@/actions/users'
import { getInitials } from '@/lib/utils'

interface AvatarUploadProps {
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
  disabled?: boolean
}

export function AvatarUpload({ user, disabled = false }: AvatarUploadProps) {
  const router = useRouter()
  const { success, error, warning } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      warning('Please select an image file')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      warning('File size must be less than 2MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!fileInputRef.current?.files?.[0]) return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', fileInputRef.current.files[0])

      const result = await uploadAvatarAction(user.id, formData)

      if (!result.success) {
        error(result.error || 'Failed to upload avatar')
        setIsLoading(false)
        return
      }

      success('Avatar uploaded successfully')
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
      setIsLoading(false)
    } catch {
      error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayAvatar = preview || user.avatar_url

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        {displayAvatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displayAvatar}
            alt={user.name}
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-mvm-blue text-4xl font-bold text-white">
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              Choose Photo
            </Button>
          ) : (
            <div className="space-y-2">
              <Button type="button" onClick={handleUpload} isLoading={isLoading} className="w-full">
                Upload Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
        </>
      )}
    </div>
  )
}
