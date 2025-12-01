import type { BlogContributor } from '@/types'

interface ContributorCardProps {
  contributor: BlogContributor
}

export function ContributorCard({ contributor }: ContributorCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {contributor.avatar_url ? (
            <img
              src={contributor.avatar_url}
              alt={contributor.full_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-mvm text-xl font-bold text-white">
              {contributor.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{contributor.full_name}</h3>
            <p className="text-sm text-mvm-blue">{contributor.position}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">{contributor.bio}</p>

        {contributor.expertise.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Expertise
            </h4>
            <div className="flex flex-wrap gap-2">
              {contributor.expertise.map((exp, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>
        )}

        {contributor.stats && contributor.stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {contributor.stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-lg bg-gray-50 p-2 text-center text-xs text-gray-700"
              >
                {stat}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          {contributor.post_count} {contributor.post_count === 1 ? 'post' : 'posts'}
        </div>
      </div>
    </div>
  )
}
