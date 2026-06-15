/**
 * ClaimPendingUpload — invisible component that runs once after sign-in.
 * If there's a pending upload token in localStorage (from the landing page
 * quick-analyze flow), it calls the claim-upload endpoint to attach the
 * document to the user's case, then clears the token.
 */
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { claimUpload } from '@/lib/api'

export default function ClaimPendingUpload() {
  const { data: session, status } = useSession()
  const claimed = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || claimed.current) return

    const token = localStorage.getItem('tg_pending_upload_token')
    if (!token) return

    const accessToken = (session as any)?.access_token as string | undefined
    if (!accessToken) return

    claimed.current = true

    // Attempt to claim the upload
    claimUpload(token, null, accessToken)
      .then((res) => {
        // Store the submission ID so the intake chat can pick it up
        if (res.submission_id) {
          localStorage.setItem('tg_intake_submission_id', String(res.submission_id))
        }
        // Clear the pending token
        localStorage.removeItem('tg_pending_upload_token')
      })
      .catch((err) => {
        console.warn('Failed to claim pending upload:', err)
        // Don't block the user — they can still use the platform
        // The token stays in localStorage for a retry on next page load
        claimed.current = false
      })
  }, [status, session])

  return null // This component renders nothing
}
