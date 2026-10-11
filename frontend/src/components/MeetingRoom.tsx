import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useState } from 'react'

interface MeetingRoomProps {
  serverUrl: string
  token: string
  meetingCode: string
  audioEnabled: boolean
  videoEnabled: boolean
  onLeave: () => void
}

export default function MeetingRoom({
  serverUrl,
  token,
  meetingCode,
  audioEnabled,
  videoEnabled,
  onLeave,
}: MeetingRoomProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [message, setMessage] = useState('')

  function getInviteUrl() {
    const url = new URL(window.location.href)
    url.searchParams.set('room', meetingCode)
    return url.toString()
  }

  async function copyInviteLink() {
    const inviteUrl = getInviteUrl()
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setMessage('Invite link copied!')
    } catch {
      window.prompt('Copy this meeting link:', inviteUrl)
      setMessage('Copy the link from the box to share it.')
    }
  }

  async function shareMeeting() {
    const inviteUrl = getInviteUrl()
    const shareText = `Join my Meetora meeting. Meeting code: ${meetingCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Meetora meeting',
          text: shareText,
          url: inviteUrl,
        })
        setMessage('')
        setMenuOpen(false)
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    await copyInviteLink()
    setMenuOpen(false)
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={audioEnabled}
      video={videoEnabled}
      onDisconnected={onLeave}
      data-lk-theme="default"
      style={{ height: '100vh', position: 'relative' }}
    >
      <VideoConference />


      <VideoConference />

      <div className="fixed bottom-24 right-4 z-[100] flex items-center gap-2">
        {message && (
          <span
            role="status"
            className="max-w-[calc(100vw-2rem)] rounded-lg bg-slate-900/95 px-3 py-2 text-sm text-white shadow-lg"
          >
            {message}
          </span>
        )}

        <div className="relative">
          <button
            type="button"
            aria-label={menuOpen ? 'Close meeting options' : 'Open meeting options'}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((open) => !open)
              setMessage('')
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-900/95 text-2xl font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 flex min-w-48 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 text-white shadow-xl">
              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-800"
              >
                Copy invite link
              </button>
              <button
                type="button"
                onClick={() => void shareMeeting()}
                className="rounded-lg px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-800"
              >
                Share meeting
              </button>
            </div>
          )}
        </div>
      </div>

    </LiveKitRoom>
  )
}
