import { useState, useRef, useEffect } from 'react'
import Spinner from '@/components/Spinner'

type Props = {
  onSave: (audioBlob: Blob, transcript: string) => Promise<void>
  onClose: () => void
}

// Web Speech API's SpeechRecognition is unprefixed in Chrome/Edge, still webkit-prefixed
// in Safari, and absent entirely in Firefox as of this writing. Feature-detecting rather
// than assuming — recording works everywhere, live transcription only where this exists.
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export default function VoiceRecorderModal({ onSave, onClose }: Props) {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: any) => {
          let finalText = ''
          for (let i = 0; i < event.results.length; i++) {
            finalText += event.results[i][0].transcript
          }
          setTranscript(finalText)
        }
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch {
      setError("Couldn't access your microphone — check your browser permission and try again.")
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    recognitionRef.current?.stop()
    setRecording(false)
  }

  async function handleSave() {
    if (!audioBlob) return
    setSaving(true)
    try {
      await onSave(audioBlob, transcript)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card w-full max-w-[420px] p-7 shadow-hard sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-extrabold">Voice note</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {error}
          </div>
        )}

        {!audioBlob ? (
          <div className="flex flex-col items-center gap-5 py-6">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-[2.5px] border-ink text-[28px] shadow-hard-sm ${
                recording ? 'animate-pulse bg-pink' : 'bg-white'
              }`}
            >
              {recording ? '⏹️' : '🎤'}
            </button>
            <p className="text-[13.5px] font-semibold text-[#4a4460]">
              {recording ? 'Recording… tap to stop' : 'Tap to start recording'}
            </p>

            {recording && (
              <div className="w-full rounded-xl border-2 border-ink/20 bg-paper-dim p-3 text-[13px] font-medium text-[#4a4460]">
                {SpeechRecognitionAPI
                  ? transcript || 'Listening…'
                  : "Live transcription isn't supported in this browser — the audio will still save fine."}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <audio src={audioUrl!} controls className="w-full" />

            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
                Transcript {!SpeechRecognitionAPI && '(not available in this browser)'}
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="You can edit or add the transcript here"
                rows={3}
                className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[13.5px] font-medium outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAudioBlob(null)
                  setAudioUrl(null)
                  setTranscript('')
                }}
                className="btn-secondary flex-1"
              >
                Re-record
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner /> Saving…
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}