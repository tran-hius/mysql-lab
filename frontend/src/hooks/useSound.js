import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'mysql-lab:sound'

const PATTERNS = {
  select: [{ freq: 660, duration: 0.04, type: 'square' }],
  run: [
    { freq: 440, duration: 0.06, type: 'sine' },
    { freq: 660, duration: 0.06, type: 'sine', delay: 0.07 },
  ],
  success: [
    { freq: 660, duration: 0.06, type: 'sine' },
    { freq: 880, duration: 0.06, type: 'sine', delay: 0.07 },
    { freq: 990, duration: 0.08, type: 'sine', delay: 0.14 },
  ],
  error: [{ freq: 180, duration: 0.18, type: 'sawtooth' }],
}

function readPreference() {
  return localStorage.getItem(STORAGE_KEY) !== 'off'
}

export function useSound() {
  const [enabled, setEnabled] = useState(readPreference)
  const contextRef = useRef(null)

  useEffect(
    () => () => {
      contextRef.current?.close?.()
      contextRef.current = null
    },
    [],
  )

  const ensureContext = () => {
    if (!contextRef.current) {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext
      if (!AudioCtor) return null

      try {
        contextRef.current = new AudioCtor()
      } catch {
        return null
      }
    }

    try {
      const resumed = contextRef.current.resume?.()
      if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {})
    } catch {
      // Trình duyệt chặn audio trước thao tác đầu tiên: bỏ qua, lần sau thử lại.
    }

    return contextRef.current
  }

  const play = useCallback(
    (name) => {
      if (!enabled) return
      const pattern = PATTERNS[name]
      const context = ensureContext()
      if (!pattern || !context) return

      try {
        for (const note of pattern) {
          const start = context.currentTime + (note.delay ?? 0)
          const oscillator = context.createOscillator()
          const gain = context.createGain()

          oscillator.type = note.type
          oscillator.frequency.setValueAtTime(note.freq, start)
          gain.gain.setValueAtTime(0.04, start)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)

          oscillator.connect(gain)
          gain.connect(context.destination)
          oscillator.start(start)
          oscillator.stop(start + note.duration)
        }
      } catch {
        // Âm thanh là phụ trợ: lỗi Web Audio không được làm hỏng thao tác chính.
      }
    },
    [enabled],
  )

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      return next
    })
  }, [])

  return { enabled, toggle, play }
}
