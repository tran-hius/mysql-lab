import { useState } from 'react'

export default function SchemaExplorer({ database, tables }) {
  const [open, setOpen] = useState(() => new Set())

  const toggle = (name) => {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <aside className="schema-explorer" aria-label="Cấu trúc database">
      <header className="schema-head">
        <p className="eyebrow">Schema</p>
        <h2>{database ?? 'shop'}</h2>
        <p className="results-meta">{tables.length} bảng · chỉ đọc</p>
      </header>

      <ul className="schema-tables">
        {tables.map((table) => {
          const expanded = open.has(table.name)

          return (
            <li key={table.name} className="schema-table">
              <button
                type="button"
                className="schema-table-toggle"
                aria-expanded={expanded}
                onClick={() => toggle(table.name)}
              >
                <span className="schema-table-name">{table.name}</span>
                <span className="schema-table-count">{table.rowCount} dòng</span>
                <span className="schema-chevron" aria-hidden="true">
                  {expanded ? '−' : '+'}
                </span>
              </button>

              {expanded && (
                <div className="schema-table-body">
                  <table className="schema-columns">
                    <thead>
                      <tr>
                        <th scope="col">Cột</th>
                        <th scope="col">Kiểu</th>
                        <th scope="col">Khóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column) => (
                        <tr key={column.name}>
                          <td>
                            {column.name}
                            {column.nullable ? '' : ' *'}
                          </td>
                          <td>{column.type}</td>
                          <td>{column.key || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="schema-sample-title">3 dòng mẫu</p>
                  <pre className="schema-sample">
                    {JSON.stringify(table.sampleRows, null, 2)}
                  </pre>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
