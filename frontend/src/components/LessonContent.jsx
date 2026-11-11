function TableBlock({ block }) {
  return (
    <div className="table-wrap lesson-table">
      <table>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'p':
      return <p className="lesson-paragraph">{block.text}</p>
    case 'h3':
      return <h3 className="lesson-subhead">{block.text}</h3>
    case 'list':
      return (
        <ul className="lesson-list">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="lesson-steps">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <pre className="lesson-code">
          <code>{block.sql}</code>
        </pre>
      )
    case 'table':
      return <TableBlock block={block} />
    case 'callout':
      return (
        <aside className={`callout is-${block.tone ?? 'note'}`}>
          {block.title && <p className="callout-title">{block.title}</p>}
          <p>{block.text}</p>
        </aside>
      )
    default:
      return null
  }
}

export default function LessonContent({ blocks }) {
  return (
    <div className="lesson-content">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
