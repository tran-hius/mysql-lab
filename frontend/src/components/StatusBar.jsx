const STATES = {
  connected: { label: 'MySQL đã kết nối', tone: 'ok' },
  disconnected: { label: 'MySQL chưa kết nối', tone: 'error' },
  unknown: { label: 'Đang kiểm tra MySQL…', tone: 'idle' },
}

export default function StatusBar({ health, soundEnabled, onToggleSound }) {
  const status = health?.database?.status ?? (health ? 'disconnected' : 'unknown')
  const state = STATES[status] ?? STATES.unknown

  return (
    <div className="status-bar">
      <span className={`status-dot is-${state.tone}`} aria-hidden="true" />
      <span className="status-label">{state.label}</span>
      <button
        type="button"
        className="sound-toggle"
        aria-pressed={soundEnabled}
        onClick={onToggleSound}
      >
        <span className={`sound-icon is-${soundEnabled ? 'on' : 'off'}`} aria-hidden="true" />
        Âm thanh
      </button>
    </div>
  )
}
