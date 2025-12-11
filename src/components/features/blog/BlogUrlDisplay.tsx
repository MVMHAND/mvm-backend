'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BlogUrlDisplayProps {
  slug: string
  status: 'draft' | 'published' | 'unpublished'
  mainSiteUrls: string[]
  socialPreviewUrl: string
  blogPreviewUrl: string
}

export function BlogUrlDisplay({ slug, status, mainSiteUrls, socialPreviewUrl, blogPreviewUrl }: BlogUrlDisplayProps) {
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

  const UrlRow = ({ label, url, description }: { label: string; url: string; description?: string }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {description && (
            <span className="text-xs text-gray-500">({description})</span>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-mvm-blue hover:underline break-all"
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        <CardTitle>Blog URLs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Blog Preview URL - Always available */}
        <UrlRow
          label="Blog Preview"
          url={blogPreviewUrl}
        />

        {/* Social Media Preview URL - Only for published posts */}
        {status === 'published' && (
          <UrlRow
            label="Social Media Preview"
            url={socialPreviewUrl}
            description="for social sharing"
          />
        )}

        {/* Main Site URLs - Only for published posts */}
        {status === 'published' && (
          <>
            <UrlRow
              label="Primary Site URL"
              url={`${mainSiteUrls[0]}/blog/${slug}`}
              description="main production URL"
            />

            {mainSiteUrls.slice(1).map((siteUrl, index) => (
              <UrlRow
                key={siteUrl}
                label={`Alternate Site URL ${index + 1}`}
                url={`${siteUrl}/blog/${slug}`}
                description="alternate domain"
              />
            ))}
          </>
        )}

        {status !== 'published' && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Production URLs will be available once this post is published.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
