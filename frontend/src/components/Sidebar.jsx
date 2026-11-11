const GROUP_ORDER = ['Doanh thu', 'Sản phẩm', 'Khách hàng', 'Bài tập']

function groupQueries(queries) {
  const groups = new Map()

  for (const query of queries) {
    if (!groups.has(query.group)) groups.set(query.group, [])
    groups.get(query.group).push(query)
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const indexA = GROUP_ORDER.indexOf(a)
    const indexB = GROUP_ORDER.indexOf(b)
    return (indexA < 0 ? GROUP_ORDER.length : indexA) - (indexB < 0 ? GROUP_ORDER.length : indexB)
  })
}

export default function Sidebar({ queries, activeId, onSelect }) {
  return (
    <nav className="sidebar" aria-label="Danh sách truy vấn">
      {groupQueries(queries).map(([group, items]) => (
        <section className="sidebar-group" key={group}>
          <h2 className="sidebar-heading">{group}</h2>
          <ul className="sidebar-list">
            {items.map((query) => (
              <li key={query.id}>
                <button
                  type="button"
                  className="sidebar-item"
                  aria-current={activeId === query.id ? 'true' : undefined}
                  onClick={() => onSelect(query.id)}
                >
                  {query.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
