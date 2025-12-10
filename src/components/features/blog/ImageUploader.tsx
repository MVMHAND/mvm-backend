'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  currentUrl?: string | null
  maxSizeMB?: number
  label?: string
  accept?: string
  hidePreview?: boolean
}

export function ImageUploader({
  onUpload,
  currentUrl,
  maxSizeMB = 5,
  label = 'Upload Image',
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  hidePreview = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      const allowedTypes = accept.split(',').map((t) => t.trim())
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, and WebP are allowed.')
        return
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit.`)
        return
      }

      // Show preview immediately from local file
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Store pending file for upload on save
      setPendingFile(file)

      // Upload file immediately (for existing posts that need immediate upload)
      // For new posts, this will just validate and show preview
      setIsUploading(true)
      try {
        const result = await onUpload(file)
        if (!result.success) {
          setError(result.error || 'Upload failed')
          setPreview(currentUrl || null)
          setPendingFile(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setPreview(currentUrl || null)
        setPendingFile(null)
      } finally {
        setIsUploading(false)
      }
    },
    [accept, maxSizeMB, onUpload, currentUrl]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    setPendingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {preview && !hidePreview ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
            {pendingFile && !currentUrl && (
              <div className="absolute top-2 right-2 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                Will upload on save
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Change Image
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : hidePreview ? (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-mvm-blue" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {preview ? 'Change Image' : 'Upload Image'}
                </Button>
                {preview && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                )}
              </>
            )}
          </div>
          {pendingFile && !currentUrl && (
            <p className="text-xs text-amber-600 font-medium">
              ✓ Image selected - will upload on save
            </p>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragging
              ? 'border-mvm-blue bg-mvm-blue/5'
              : 'border-gray-300 hover:border-mvm-blue hover:bg-gray-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="space-y-2">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-mvm-blue" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-mvm-blue">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP up to {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  )
}
