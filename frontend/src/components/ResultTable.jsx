import { formatCell, NUMERIC_TYPES } from '../lib/format.js'

export default function ResultTable({ columns, rows }) {
  if (!rows?.length) {
    return <p className="empty-rows">Truy vấn không trả về dòng nào.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.name}
                scope="col"
                className={NUMERIC_TYPES.has(column.type) ? 'is-number' : undefined}
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.name}
                  className={NUMERIC_TYPES.has(column.type) ? 'is-number' : undefined}
                >
                  {formatCell(row[column.name], column.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
