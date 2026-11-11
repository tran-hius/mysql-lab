export default function SqlEditor({ value, onChange, onRun, disabled = false, placeholder }) {
  return (
    <div className="sql-editor">
      <label className="field-label" htmlFor="sql-editor-input">
        SQL của bạn
      </label>
      <textarea
        id="sql-editor-input"
        className="sql-textarea"
        value={value}
        placeholder={placeholder ?? 'Viết SELECT ở đây. Ctrl+Enter để chạy.'}
        spellCheck={false}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault()
            onRun()
          }
        }}
      />
      <p className="sql-editor-hint">Ctrl+Enter để chạy &amp; chấm.</p>
    </div>
  )
}
