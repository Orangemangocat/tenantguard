import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { getIntakeSubmission } from '@/lib/api'

interface Props {
  session: any
  testFetch: any
}

export default function DebugSession({ session, testFetch }: Props) {
  return (
    <pre style={{ padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
      {JSON.stringify({ session, testFetch }, null, 2)}
    </pre>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const raw = await getServerSession(context.req, context.res, authOptions)
  const session = raw as any

  const sessionInfo = {
    exists: !!session,
    hasAccessToken: !!session?.access_token,
    tokenPreview: session?.access_token?.slice(0, 30) ?? null,
    user: session?.user ?? null,
  }

  let testFetch = null
  if (session?.access_token) {
    try {
      const data = await getIntakeSubmission(7, session.access_token)
      testFetch = { ok: true, data }
    } catch (err: any) {
      testFetch = {
        ok: false,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      }
    }
  }

  return { props: { session: sessionInfo, testFetch } }
}
