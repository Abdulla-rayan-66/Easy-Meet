import { useState } from 'react'
import MeetingRoom from './components/MeetingRoom'
import { PreJoin } from '@livekit/components-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface MeetingCredentials {
  token: string
  serverUrl: string
}

function cleanMeetingUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('room')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function setMeetingUrl(roomName: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('room', roomName)
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function App() {
  const initialRoom = new URLSearchParams(window.location.search).get('room') || ''
  const [meetingCode, setMeetingCode] = useState(initialRoom)
  const [pendingRoomName, setPendingRoomName] = useState(initialRoom)
  const [mediaChoices, setMediaChoices] = useState({
    audioEnabled: true,
    videoEnabled: true,
  })
  const [participantName, setParticipantName] = useState('')
  const [credentials, setCredentials] = useState<MeetingCredentials | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'start' | 'join' | null>(null)
  const [notice, setNotice] = useState('')

  function createMeeting() {
    const roomName = crypto.randomUUID().slice(0, 8)
    setMeetingCode(roomName)
    setPendingRoomName('')
    setError('')
    setNotice('')
    setMeetingUrl(roomName)
    setModal('start')
  }

  async function copyInviteLink(roomName: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('room', roomName)
    try {
      await navigator.clipboard.writeText(url.toString())
      setNotice('Invite link copied!')
      setError('')
    } catch {
      setNotice('')
      setError('Unable to copy automatically. Copy this link from your browser address bar.')
    }
  }

  async function joinMeeting(
    roomName: string,
    name = participantName,
    audioEnabled = true,
    videoEnabled = true,
  ) {
    if (!roomName.trim() || !name.trim()) {
      setError('Enter your name and a meeting code.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    setMeetingCode(roomName.trim())
    setMeetingUrl(roomName.trim())

    try {
      const response = await fetch(`${API_URL}/api/meetings/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          participantName: name.trim(),
        }),
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data === 'object' &&
            data !== null &&
            'error' in data &&
            typeof data.error === 'string'
            ? data.error
            : 'Unable to join the meeting.',
        )
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        !('token' in data) ||
        typeof data.token !== 'string' ||
        !('serverUrl' in data) ||
        typeof data.serverUrl !== 'string'
      ) {
        throw new Error('The server returned an invalid response.')
      }

      setParticipantName(name.trim())
      setMediaChoices({ audioEnabled, videoEnabled })
      setCredentials({ token: data.token, serverUrl: data.serverUrl })
      setPendingRoomName('')
      setModal(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (pendingRoomName && !credentials) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10">
          <div className="mb-6">
            <p className="text-sm font-medium text-blue-400">MEETORA</p>
            <h1 className="mt-2 text-3xl font-bold">Ready to join?</h1>
            <p className="mt-2 text-slate-400">Meeting code: {pendingRoomName}</p>
            <p className="mt-1 text-sm text-slate-400">
              Check your camera and microphone before entering.
            </p>
          </div>

          <PreJoin
            key={pendingRoomName}
            defaults={{ username: participantName, videoEnabled: true, audioEnabled: true }}
            joinLabel="Join meeting"
            onError={(joinError) => setError(joinError.message)}
            onSubmit={(choices) => {
              setParticipantName(choices.username)
              void joinMeeting(
                pendingRoomName,
                choices.username,
                choices.audioEnabled,
                choices.videoEnabled,
              )
            }}
          />

          {loading && <p className="mt-4 text-center text-blue-300">Connecting to your meeting...</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={() => {
              setPendingRoomName('')
              setMeetingCode('')
              setError('')
              cleanMeetingUrl()
            }}
            className="mt-5 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800"
          >
            Cancel and return
          </button>
        </div>
      </div>
    )
  }

  if (credentials) {
    return (
      <MeetingRoom
        serverUrl={credentials.serverUrl}
        token={credentials.token}
        meetingCode={meetingCode}
        audioEnabled={mediaChoices.audioEnabled}
        videoEnabled={mediaChoices.videoEnabled}
        onLeave={() => {
          setCredentials(null)
          setPendingRoomName('')
          setMeetingCode('')
          setModal(null)
          setError('')
          setNotice('')
          cleanMeetingUrl()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" onClick={(event) => { event.preventDefault(); cleanMeetingUrl(); setModal(null); setMeetingCode(''); setPendingRoomName('') }} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold">M</div>
          <span className="text-2xl font-bold tracking-tight">Meetora</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#about" className="transition hover:text-white">About</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Better conversations start here
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Bring everyone
              <span className="block text-blue-400">closer together.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Meetora makes it easy to connect, collaborate, and share ideas through seamless online meetings.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={createMeeting}
                className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500"
              >
                Start a meeting
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setNotice(''); setModal('join') }}
                className="rounded-xl border border-slate-700 px-6 py-3.5 font-semibold transition hover:bg-slate-800"
              >
                Join a meeting
              </button>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
              <span>✓ HD video calls</span>
              <span>✓ Screen sharing</span>
              <span>✓ Real-time chat</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-blue-950/40">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="font-semibold">Team Standup</p>
                  <p className="mt-1 text-xs text-slate-400">Meetora video meeting</p>
                </div>
                <span className="rounded-lg bg-red-500/15 px-3 py-1 text-xs text-red-300">● Live preview</span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-4">
                {[
                  { initial: 'A', name: 'Alex Morgan', style: 'from-indigo-500 to-blue-700' },
                  { initial: 'S', name: 'Sarah Chen', style: 'from-emerald-600 to-teal-800' },
                  { initial: 'J', name: 'James Wilson', style: 'from-purple-600 to-fuchsia-800' },
                  { initial: 'M', name: 'Maya Patel', style: 'from-orange-500 to-rose-700' },
                ].map((person) => (
                  <div key={person.name} className={`flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${person.style}`}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">{person.initial}</div>
                    <p className="mt-3 text-sm font-medium">{person.name}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 border-t border-slate-800 pt-4">
                <span className="rounded-xl bg-slate-800 px-4 py-3 text-sm">🎙️</span>
                <span className="rounded-xl bg-slate-800 px-4 py-3 text-sm">📹</span>
                <span className="rounded-xl bg-slate-800 px-4 py-3 text-sm">🖥️</span>
                <span className="rounded-xl bg-red-600 px-5 py-3 text-sm">End</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="text-center text-3xl font-bold">Everything you need to connect</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { title: 'HD Video Meetings', description: 'Meet face-to-face with a clean, easy-to-use meeting interface.', icon: '🎥' },
              { title: 'Screen Sharing', description: 'Share your screen to explain ideas and collaborate visually.', icon: '🖥️' },
              { title: 'Live Messaging', description: 'Exchange messages while collaborating in a meeting.', icon: '💬' },
            ].map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500/50">
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="border-t border-slate-800 px-6 py-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Meetora. Built for better conversations.</p>
            <p>A real-time communication project.</p>
          </div>
        </section>
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="meeting-dialog-title" className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-wide text-blue-400">MEETORA</p>
                <h2 id="meeting-dialog-title" className="mt-2 text-2xl font-bold">
                  {modal === 'start' ? 'Start a meeting' : 'Join a meeting'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {modal === 'start' ? 'Share the invite link before you start, or enter your name to begin.' : 'Enter the meeting code and your name to continue.'}
                </p>
              </div>
              <button type="button" aria-label="Close popup" onClick={() => { setModal(null); setError(''); setNotice(''); if (modal === 'start') { setMeetingCode(''); cleanMeetingUrl() } }} className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-800 hover:text-white">×</button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                const room = modal === 'start' ? meetingCode : meetingCode.trim()
                void joinMeeting(room, participantName)
              }}
            >
              {modal === 'start' ? (
                <div>
                  <label htmlFor="generated-meeting-code" className="mb-2 block text-sm font-medium text-slate-300">Meeting code</label>
                  <div className="flex gap-2">
                    <input id="generated-meeting-code" readOnly value={meetingCode} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    <button type="button" onClick={() => void copyInviteLink(meetingCode)} className="rounded-xl border border-slate-700 px-4 py-3 font-semibold hover:bg-slate-800">Copy link</button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="dialog-meeting-code" className="mb-2 block text-sm font-medium text-slate-300">Meeting code</label>
                  <input id="dialog-meeting-code" value={meetingCode} onChange={(event) => setMeetingCode(event.target.value)} placeholder="Enter meeting code" maxLength={100} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-500" />
                </div>
              )}

              <div>
                <label htmlFor="dialog-participant-name" className="mb-2 block text-sm font-medium text-slate-300">Your name</label>
                <input id="dialog-participant-name" value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Enter your name" maxLength={80} required autoFocus className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-500" />
              </div>

              {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
              {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setModal(null); setError(''); setNotice(''); if (modal === 'start') { setMeetingCode(''); cleanMeetingUrl() } }} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Connecting...' : modal === 'start' ? 'Start meeting' : 'Join meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
