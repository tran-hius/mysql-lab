import { useCallback, useEffect, useState } from 'react'
import { getSchema, runSandbox } from '../api/client.js'
import ResultTable from './ResultTable.jsx'
import SchemaExplorer from './SchemaExplorer.jsx'
import SqlEditor from './SqlEditor.jsx'

const DEFAULT_SQL = 'SELECT * FROM customers LIMIT 5;'

export default function Sandbox({ play }) {
  const [schema, setSchema] = useState(null)
  const [schemaError, setSchemaError] = useState(null)
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    getSchema(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setSchema(data)
      })
      .catch((failure) => {
        if (failure.name === 'AbortError') return
        setSchemaError(failure)
      })

    return () => controller.abort()
  }, [])

  const run = useCallback(async () => {
    const statement = sql.trim()
    if (!statement || status === 'loading') return

    setStatus('loading')
    setError(null)
    setResult(null)
    play?.('run')

    try {
      const data = await runSandbox(statement)
      setResult(data)
      setStatus('ready')
      play?.('success')
    } catch (failure) {
      setError(failure)
      setStatus('error')
      play?.('error')
    }
  }, [sql, status, play])

  const reset = () => {
    setSql(DEFAULT_SQL)
    setResult(null)
    setError(null)
    setStatus('idle')
  }

  return (
    <main className="sandbox">
      <section className="sandbox-side">
        {schemaError ? (
          <div className="schema-error" role="alert">
            <p className="field-label">Schema</p>
            <p>Không tải được schema.</p>
            <p className="results-meta">{schemaError.message}</p>
          </div>
        ) : schema ? (
          <SchemaExplorer database={schema.database} tables={schema.tables} />
        ) : (
          <p className="notice" role="status">
            Đang tải schema…
          </p>
        )}
      </section>

      <section className="sandbox-main">
        <header className="sandbox-head">
          <div>
            <p className="eyebrow">Sandbox</p>
            <h1>Console SQL chỉ đọc</h1>
            <p className="description">
              Chạy SELECT/WITH/EXPLAIN trên database <code>shop</code>. Mọi lệnh ghi đều bị chặn,
              tối đa 200 dòng và 3 giây mỗi truy vấn.
            </p>
          </div>
          <div className="content-actions">
            <button
              type="button"
              className="primary-button"
              onClick={run}
              disabled={status === 'loading' || !sql.trim()}
            >
              {status === 'loading' ? 'Đang chạy…' : 'Chạy'}
            </button>
            <button type="button" className="ghost-button" onClick={reset}>
              Xóa
            </button>
          </div>
        </header>

        <SqlEditor
          id="sandbox-sql"
          label="SQL của bạn"
          hint="Ctrl+Enter để chạy. Chỉ SELECT, WITH và EXPLAIN được phép."
          value={sql}
          onChange={setSql}
          onRun={run}
          disabled={status === 'loading'}
          placeholder="SELECT * FROM orders LIMIT 10;"
        />

        {status === 'loading' && (
          <div className="loading" role="status" aria-busy="true">
            <span className="visually-hidden">Đang chạy truy vấn…</span>
            {Array.from({ length: 4 }, (_, index) => (
              <span className="skeleton-row" key={index} aria-hidden="true" />
            ))}
          </div>
        )}

        {status === 'error' && error && (
          <div className="error-box" role="alert">
            <h2>Truy vấn thất bại</h2>
            <p>{error.message}</p>
            {error.hint && <p className="hint">{error.hint}</p>}
          </div>
        )}

        {status === 'ready' && result && (
          <>
            <p className="sandbox-meta">
              {result.rowCount} dòng · {result.durationMs} ms
              {result.truncated ? ` · chỉ hiện ${result.rowCount}/${result.totalRows}` : ''}
            </p>
            <ResultTable columns={result.columns} rows={result.rows} />
          </>
        )}
      </section>
    </main>
  )
}
