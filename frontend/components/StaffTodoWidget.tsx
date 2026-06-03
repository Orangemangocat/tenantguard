import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Script from 'next/script'

export default function StaffTodoWidget() {
  const { data: session } = useSession()
  const isStaff = (session as any)?.user?.is_staff

  if (!isStaff) return null

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/static/stafftodo/stafftodo.css" />
      </Head>

      <button id="todo-launcher" title="Dev Tasks" aria-label="Open dev tasks panel">💩</button>
      <div id="todo-overlay" aria-hidden="true"></div>
      <aside id="todo-panel" aria-label="Dev Tasks" aria-hidden="true">
        <div className="td-panel-header">
          <h2 className="td-panel-title">💩 Dev Tasks</h2>
          <button className="td-panel-close" aria-label="Close panel">✕</button>
        </div>
        <div id="todo-panel-body"></div>
      </aside>

      <Script src="/static/stafftodo/stafftodo.js" strategy="afterInteractive" />
    </>
  )
}
