import { useEffect, useRef, useState } from 'react'

export default function SqlPanel({ sql }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
    },
    [],
  )

  const copy = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!navigator.clipboard?.writeText) return

    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="sql-panel">
      <summary>
        <span>Câu SQL đã dùng</span>
        <button type="button" className="copy-button" onClick={copy}>
          <span aria-live="polite">{copied ? 'Đã copy' : 'Copy'}</span>
        </button>
      </summary>
      <pre>
        <code>{sql}</code>
      </pre>
    </details>
  )
}
