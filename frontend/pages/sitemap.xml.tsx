import { GetServerSideProps } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'

const STATIC_PAGES = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/blog', changefreq: 'daily', priority: '0.9' },
]

function buildSitemapXml(posts: Array<{ slug: string; created_at: string }>) {
  const staticEntries = STATIC_PAGES.map(
    ({ url, changefreq, priority }) => `
  <url>
    <loc>${SITE_URL}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join('')

  const postEntries = posts.map(
    ({ slug, created_at }) => `
  <url>
    <loc>${SITE_URL}/blog/${slug}</loc>
    <lastmod>${new Date(created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>`
}

export default function Sitemap() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let posts: Array<{ slug: string; created_at: string }> = []

  try {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:8000/api/'
    const response = await fetch(`${apiUrl}blog/posts/`)
    if (response.ok) {
      posts = await response.json()
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch posts', err)
  }

  const xml = buildSitemapXml(posts)

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.write(xml)
  res.end()

  return { props: {} }
}
