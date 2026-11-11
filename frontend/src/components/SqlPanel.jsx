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

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(sql)
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
          {copied ? 'Đã copy' : 'Copy'}
        </button>
      </summary>
      <pre>
        <code>{sql}</code>
      </pre>
    </details>
  )
}
