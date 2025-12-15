import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPublicPostBySlug } from '@/lib/blog/public-posts'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Parse MAIN_SITE_URL from environment variable (array format)
const getMainSiteUrls = (): string[] => {
  const envValue = process.env.MAIN_SITE_URL
  if (!envValue) throw new Error('MAIN_SITE_URL is not defined')
      
  try {
    const parsed = JSON.parse(envValue)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [envValue]
  }
}

const MAIN_SITE_URLS = getMainSiteUrls()
const MAIN_SITE_URL = MAIN_SITE_URLS[0]

/**
 * Detect if the request is from a social media crawler/bot
 * Based on Next.js's own bot detection for metadata
 */
function isCrawlerBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit',
    'facebookcatalog',
    'Facebot',
    'LinkedInBot',
    'Twitterbot',
    'Twitter',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'SkypeUriPreview',
    'discordbot',
    'Googlebot',
    'bingbot',
    'Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
  ]
  
  const lowerUserAgent = userAgent.toLowerCase()
  return botPatterns.some(pattern => lowerUserAgent.includes(pattern.toLowerCase()))
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicPostBySlug(slug)

  if (!post || post.status !== 'published') {
    return {
      title: 'Blog Post Not Found',
      description: 'This blog post does not exist or is not published.',
    }
  }
  
  const postUrl = `${MAIN_SITE_URL}/blog/${post.slug}`
  const title = post.seo_meta_title || post.title
  const description = post.seo_meta_description || post.description || post.title
  
  return {
    title,
    description,
    keywords: post.seo_keywords || undefined,
    authors: post.contributor?.full_name ? [{ name: post.contributor.full_name }] : undefined,
    publisher: 'My Virtual Mate',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: postUrl,
      images: post.cover_image_url ? [
        {
          url: post.cover_image_url,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : [],
      publishedTime: post.published_date || undefined,
      modifiedTime: post.updated_at,
      siteName: 'My Virtual Mate',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  }
}

/**
 * Social preview page
 * - Serves meta tags for social media crawlers
 * - Redirects real users to the main site
 */
export default async function BlogPreviewPage({ params }: PageProps) {
  const { slug } = await params
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  
  // Check if this is a crawler/bot
  const isBot = isCrawlerBot(userAgent)
  
  // For real users, redirect to main site
  if (!isBot) {
    redirect(`${MAIN_SITE_URL}/blog/${slug}`)
  }
  
  // For bots/crawlers, return minimal HTML
  // The metadata is already rendered in the <head> by Next.js
  const post = await getPublicPostBySlug(slug)

  if (!post || post.status !== 'published') {
    return (
      <div style={{ 
        fontFamily: 'system-ui, sans-serif', 
        padding: '2rem', 
        textAlign: 'center' 
      }}>
        <h1>Blog Post Not Found</h1>
        <p>This blog post does not exist or is not published.</p>
      </div>
    )
  }
  
  // Return minimal content for crawlers
  // The actual content is on the main site
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem' 
    }}>
      <h1>{post.title}</h1>
      {post.description && <p style={{ fontSize: '1.125rem', color: '#666' }}>{post.description}</p>}
      {post.cover_image_url && (
        <img 
          src={post.cover_image_url} 
          alt={post.title}
          style={{ width: '100%', height: 'auto', marginTop: '1rem' }}
        />
      )}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <p>This is a preview for social media crawlers.</p>
        <p>View the full article at: <a href={`${MAIN_SITE_URL}/blog/${slug}`}>{MAIN_SITE_URL}/blog/{slug}</a></p>
      </div>
    </div>
  )
}
