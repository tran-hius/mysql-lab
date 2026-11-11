export default function SqlEditor({
  id = 'sql-editor-input',
  label = 'SQL của bạn',
  hint = 'Ctrl+Enter để chạy & chấm.',
  value,
  onChange,
  onRun,
  disabled = false,
  placeholder,
}) {
  return (
    <div className="sql-editor">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
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
      <p className="sql-editor-hint">{hint}</p>
    </div>
  )
}
