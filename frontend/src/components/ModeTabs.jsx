const MODES = [
  { id: 'queries', label: 'Bảng truy vấn' },
  { id: 'course', label: 'Khóa học' },
  { id: 'sandbox', label: 'Sandbox' },
]

export default function ModeTabs({ mode, onChange }) {
  return (
    <div className="mode-tabs" role="group" aria-label="Chế độ làm việc">
      {MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className="mode-tab"
          aria-pressed={mode === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
