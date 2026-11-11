import { useCallback, useEffect, useRef, useState } from 'react'
import { getHealth, getQueries, runQuery } from './api/client.js'
import Course from './components/Course.jsx'
import ModeTabs from './components/ModeTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import ResultTable from './components/ResultTable.jsx'
import SqlPanel from './components/SqlPanel.jsx'
import StatusBar from './components/StatusBar.jsx'
import { useSound } from './hooks/useSound.js'
import { formatDateTime, formatNumber } from './lib/format.js'

export default function App() {
  const [mode, setMode] = useState('queries')
  const [queries, setQueries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const { enabled: soundEnabled, toggle: toggleSound, play } = useSound()
  const controllerRef = useRef(null)
  const runSoundRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    getQueries(controller.signal)
      .then(setQueries)
      .catch((loadFailure) => {
        if (loadFailure.name === 'AbortError') return
        setLoadError(loadFailure)
      })

    getHealth(controller.signal)
      .then(setHealth)
      .catch(() => {})

    return () => controller.abort()
  }, [])

  useEffect(
    () => () => {
      controllerRef.current?.abort()
      clearTimeout(runSoundRef.current)
    },
    [],
  )

  const execute = useCallback(
    (id, { selectSound = false } = {}) => {
      if (!id) return

      controllerRef.current?.abort()
      clearTimeout(runSoundRef.current)

      const controller = new AbortController()
      controllerRef.current = controller

      setActiveId(id)
      setStatus('loading')
      setResult(null)
      setError(null)
      if (selectSound) play('select')
      runSoundRef.current = setTimeout(() => play('run'), 70)

      runQuery(id, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return
          clearTimeout(runSoundRef.current)
          setResult(data)
          setStatus('ready')
          play('success')
        })
        .catch((queryFailure) => {
          if (queryFailure.name === 'AbortError' || controller.signal.aborted) return
          clearTimeout(runSoundRef.current)
          setError({ message: queryFailure.message, hint: queryFailure.hint })
          setStatus('error')
          play('error')
        })
    },
    [play],
  )

  const activeQuery = queries.find((query) => query.id === activeId) ?? null

  return (
    <div className="app">
      <header className="topbar">
        <a className="wordmark" href="/">
          MySQL<span>Lab</span>
        </a>
        <ModeTabs mode={mode} onChange={setMode} />
        <StatusBar health={health} soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      </header>

      {mode === 'queries' &&
        (loadError ? (
          <main className="fatal">
            <h1>Không tải được danh sách truy vấn</h1>
            <p>{loadError.message}</p>
            {loadError.hint && <p className="hint">{loadError.hint}</p>}
            <button type="button" className="primary-button" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </main>
        ) : (
          <div className="workspace">
            <Sidebar queries={queries} activeId={activeId} onSelect={(id) => execute(id, { selectSound: true })} />

            <main className="content">
              {!activeQuery ? (
                <section className="empty-state">
                  <p className="eyebrow">Bảng truy vấn</p>
                  <h1>Chọn một truy vấn để chạy</h1>
                  <p>
                    Mười câu SQL viết tay nằm trong backend. Chọn mục ở cột bên trái, kết quả sẽ được
                    chạy thật trên MySQL và hiển thị tại đây.
                  </p>
                </section>
              ) : (
                <>
                  <header className="content-head">
                    <div>
                      <p className="eyebrow">{activeQuery.group}</p>
                      <h1>{activeQuery.title}</h1>
                      <p className="description">{activeQuery.description}</p>
                    </div>
                    <div className="content-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => execute(activeId)}
                        disabled={status === 'loading'}
                      >
                        {status === 'loading' ? 'Đang chạy…' : 'Chạy lại'}
                      </button>
                      {status === 'ready' && result && (
                        <p className="run-meta">
                          {formatNumber(result.rowCount)} dòng · {result.durationMs} ms ·{' '}
                          {formatDateTime(result.ranAt)}
                        </p>
                      )}
                    </div>
                  </header>

                  {status === 'loading' && (
                    <div className="loading" role="status" aria-busy="true">
                      <span className="visually-hidden">Đang chạy truy vấn…</span>
                      {Array.from({ length: 5 }, (_, index) => (
                        <span className="skeleton-row" key={index} aria-hidden="true" />
                      ))}
                    </div>
                  )}

                  {status === 'error' && error && (
                    <div className="error-box" role="alert">
                      <h2>Truy vấn thất bại</h2>
                      <p>{error.message}</p>
                      {error.hint && <p className="hint">{error.hint}</p>}
                      <button type="button" className="primary-button" onClick={() => execute(activeId)}>
                        Thử lại
                      </button>
                    </div>
                  )}

                  {status === 'ready' && result && (
                    <>
                      {result.truncated && (
                        <p className="notice">
                          Chỉ hiện {formatNumber(result.rowCount)} trong {formatNumber(result.totalRows)} dòng.
                        </p>
                      )}
                      <ResultTable columns={result.columns} rows={result.rows} />
                      <SqlPanel sql={result.sql} />
                    </>
                  )}
                </>
              )}
            </main>
          </div>
        ))}

      {mode === 'course' && <Course play={play} />}

      {mode === 'sandbox' && (
        <main className="content">
          <section className="empty-state">
            <p className="eyebrow">Sandbox</p>
            <h1>Khu vực chạy SQL chỉ đọc</h1>
            <p>
              Sandbox trên database <code>shop</code> sẽ có ở bước tiếp theo: editor, schema explorer
              và bảng kết quả.
            </p>
          </section>
        </main>
      )}
    </div>
  )
}
