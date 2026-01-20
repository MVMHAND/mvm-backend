'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface JobUrlDisplayProps {
  jobId: string
  status: string
  mainSiteUrls: string[]
  jobPreviewUrl: string
}

export function JobUrlDisplay({ jobId, status, mainSiteUrls, jobPreviewUrl }: JobUrlDisplayProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job URLs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Job Preview URL - Always available */}
        {jobPreviewUrl && (
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Job Preview</span>
              </div>
              <a
                href={jobPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-mvm-blue hover:underline"
              >
                {jobPreviewUrl}
              </a>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(jobPreviewUrl)}
              className="shrink-0"
            >
              {copiedUrl === jobPreviewUrl ? (
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
        )}

        {/* Main Site URLs - Only for published posts */}
        {status === 'published' && mainSiteUrls.length > 0 && (
          <>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Primary Site URL</span>
                  <span className="text-xs text-gray-500">(main production URL)</span>
                </div>
                <a
                  href={`${mainSiteUrls[0]}/careers/${jobId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-mvm-blue hover:underline"
                >
                  {`${mainSiteUrls[0]}/careers/${jobId}`}
                </a>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${mainSiteUrls[0]}/careers/${jobId}`)}
                className="shrink-0"
              >
                {copiedUrl === `${mainSiteUrls[0]}/careers/${jobId}` ? (
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

            {mainSiteUrls.slice(1).map((siteUrl, index) => {
              const alternateUrl = `${siteUrl}/careers/${jobId}`
              return (
                <div
                  key={siteUrl}
                  className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Alternate Site URL {index + 1}
                      </span>
                      <span className="text-xs text-gray-500">(alternate domain)</span>
                    </div>
                    <a
                      href={alternateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-mvm-blue hover:underline"
                    >
                      {alternateUrl}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(alternateUrl)}
                    className="shrink-0"
                  >
                    {copiedUrl === alternateUrl ? (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
            })}
          </>
        )}
      </CardContent>
    </Card>
  )
}
