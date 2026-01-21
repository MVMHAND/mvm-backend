'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type ContentStatus = 'draft' | 'published' | 'unpublished'

interface ContentUrlDisplayProps {
  title: string
  previewUrl: string
  socialPreviewUrl?: string | null
  productionUrls: {
    primary: string | null
    alternates: string[]
  }
  status: ContentStatus
}

export function ContentUrlDisplay({
  title,
  previewUrl,
  socialPreviewUrl,
  productionUrls,
  status,
}: ContentUrlDisplayProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const UrlRow = ({
    label,
    url,
    description,
  }: {
    label: string
    url: string
    description?: string
  }) => (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {description && <span className="text-xs text-gray-500">({description})</span>}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm text-mvm-blue hover:underline"
        >
          {url}
        </a>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(url)}
        className="shrink-0"
      >
        {copiedUrl === url ? (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </span>
        )}
      </Button>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Preview URL - Always shown */}
        <UrlRow label="Preview" url={previewUrl} />

        {/* Social Media Preview URL - Only for published content with social preview */}
        {socialPreviewUrl && status === 'published' && (
          <UrlRow
            label="Social Media Preview"
            url={socialPreviewUrl}
            description="for social sharing"
          />
        )}

        {/* Production URLs - Only for published */}
        {status === 'published' && (
          <>
            {productionUrls.primary && (
              <UrlRow
                label="Primary Site URL"
                url={productionUrls.primary}
                description="main production URL"
              />
            )}

            {productionUrls.alternates.map((url, index) => (
              <UrlRow
                key={url}
                label={`Alternate Site URL ${index + 1}`}
                url={url}
                description="alternate domain"
              />
            ))}
          </>
        )}

        {status !== 'published' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Production URLs will be available once this content is
              published.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
