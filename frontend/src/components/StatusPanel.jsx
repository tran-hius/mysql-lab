const STATUS_TEXT = {
  checking: 'Đang kiểm tra',
  ready: 'Đang chạy',
  down: 'Mất kết nối',
}

const formatTime = (date) =>
  date
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

export default function StatusPanel({ health, state, checkedAt, onRefresh }) {
  const database = health?.database
  const apiUp = Boolean(health?.api?.status === 'up')
  const dbUp = database?.status === 'connected'
  const latency = health?.latencyMs

  return (
    <aside className="status" aria-labelledby="status-title">
      <div className="status-head">
        <h2 id="status-title">Kết nối trực tiếp</h2>
        <button type="button" className="refresh" onClick={onRefresh} disabled={state === 'checking'}>
          {state === 'checking' ? 'Đang gọi…' : 'Kiểm tra lại'}
        </button>
      </div>

      <p className="status-summary" aria-live="polite">
        <span className={`dot ${state === 'ready' ? 'ok' : state === 'down' ? 'down' : ''}`} aria-hidden="true" />
        {STATUS_TEXT[state]}, cập nhật lúc {formatTime(checkedAt)}
      </p>

      <div className="status-rows">
        <div className="status-row">
          <span className={`dot ${apiUp ? 'ok' : state === 'down' ? 'down' : ''}`} aria-hidden="true" />
          <div>
            <p className="status-name">API backend</p>
            <p className="status-meta">Express, cổng 4000</p>
          </div>
          <p className="status-value">{apiUp ? 'Trực tuyến' : 'Không phản hồi'}</p>
        </div>

        <div className="status-row">
          <span className={`dot ${dbUp ? 'ok' : ''}`} aria-hidden="true" />
          <div>
            <p className="status-name">MySQL</p>
            <p className="status-meta">
              {dbUp ? `MySQL ${database.version}` : database?.error ?? 'chưa kết nối'}
            </p>
          </div>
          <p className="status-value">{dbUp ? 'Đã kết nối' : 'Chưa kết nối'}</p>
        </div>

        <div className="status-row">
          <span className="dot" aria-hidden="true" />
          <div>
            <p className="status-name">Độ trễ phản hồi</p>
            <p className="status-meta">một lần kiểm tra</p>
          </div>
          <p className="status-value">{Number.isFinite(latency) ? `${latency} ms` : '—'}</p>
        </div>
      </div>

      {!dbUp && (
        <div className="hint">
          <p className="hint-title">MySQL chưa sẵn sàng</p>
          <p>
            Chạy API bằng <code>npm run dev</code> trong thư mục <code>backend</code>, rồi kiểm tra
            thông tin đăng nhập trong <code>backend/.env</code>.
          </p>
        </div>
      )}
    </aside>
  )
}
