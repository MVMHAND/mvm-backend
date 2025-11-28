'use client'

import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = []
  const showEllipsis = totalPages > 7

  if (showEllipsis) {
    if (currentPage <= 3) {
      for (let i = 1; i <= Math.min(5, totalPages); i++) {
        pages.push(i)
      }
      if (totalPages > 5) {
        pages.push(-1) // Ellipsis
        pages.push(totalPages)
      }
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push(-1) // Ellipsis
      for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push(-1) // Ellipsis
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push(-2) // Ellipsis
      pages.push(totalPages)
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-md"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {pages.map((page, idx) => {
              if (page === -1 || page === -2) {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                )
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-md"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
