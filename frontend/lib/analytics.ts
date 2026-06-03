// Typed wrapper around Google Analytics (gtag.js)
// The gtag script is injected by <GoogleAnalytics> in _app.tsx.

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

export function pageview(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, { page_path: url })
}

export function event(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', action, params)
}

// ── Pre-built helpers ───────────────────────────────────────────────────────

export function trackBlogPostView(slug: string, title: string) {
  event('blog_post_view', { blog_slug: slug, blog_title: title })
}

export function trackCommentSubmit(slug: string) {
  event('comment_submit', { blog_slug: slug })
}

export function trackIntakeStart(role: 'tenant' | 'attorney') {
  event('intake_start', { intake_role: role })
}

export function trackIntakeSubmit(role: 'tenant' | 'attorney', issueType?: string) {
  event('intake_submit', { intake_role: role, issue_type: issueType })
}

export function trackIntakeAnalysis(role: 'tenant' | 'attorney') {
  event('intake_analysis_complete', { intake_role: role })
}
