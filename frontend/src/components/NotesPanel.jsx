import { useEffect, useRef, useState } from 'react'
import { exportNotes, loadNote, saveNote } from '../lib/notes.js'

const AUTOSAVE_MS = 600

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function NotesPanel({ lessonId, course }) {
  const [text, setText] = useState(() => loadNote(lessonId))
  const [status, setStatus] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const latestRef = useRef({ lessonId, text })

  useEffect(() => {
    latestRef.current = { lessonId, text }
  }, [lessonId, text])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== loadNote(lessonId)) {
        saveNote(lessonId, text)
        setStatus(text.trim() ? 'Đã lưu' : '')
      }
    }, AUTOSAVE_MS)

    return () => clearTimeout(timer)
  }, [text, lessonId])

  useEffect(
    () => () => {
      const latest = latestRef.current
      if (latest.text !== loadNote(latest.lessonId)) {
        saveNote(latest.lessonId, latest.text)
      }
    },
    [],
  )

  const handleExport = () => {
    downloadText('mysql-lab-ghi-chu.md', exportNotes(course))
  }

  return (
    <aside className="notes-panel" aria-label="Ghi chú bài học">
      <div className="notes-head">
        <label className="field-label" htmlFor={`note-${lessonId}`}>
          Ghi chú của bạn
        </label>
        <span className="notes-head-actions">
          <span className="notes-status" aria-live="polite">
            {status}
          </span>
          <button
            type="button"
            className="ghost-button notes-toggle"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? 'Mở ghi chú' : 'Thu gọn'}
          </button>
        </span>
      </div>

      {!collapsed && (
        <>
          <textarea
            id={`note-${lessonId}`}
            className="notes-textarea"
            value={text}
            placeholder="Ghi lại bẫy, lỗi đã gặp và cách sửa…"
            onChange={(event) => {
              setText(event.target.value)
              setStatus('')
            }}
          />

          <div className="notes-foot">
            <span className="notes-count">{text.length} ký tự</span>
            <button type="button" className="ghost-button" onClick={handleExport}>
              Xuất tất cả ghi chú .md
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
