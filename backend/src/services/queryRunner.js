import { performance } from 'node:perf_hooks'
import { pool } from '../config/db.js'
import { getQuery } from '../queries/index.js'
import { assertReadOnly } from './sqlGuard.js'

const MAX_ROWS = 500

export async function runQuery(id) {
  const query = getQuery(id)
  if (!query) return null

  assertReadOnly(query.sql)

  const startedAt = performance.now()
  const [rows, fields] = await pool.query(query.sql)
  const durationMs = Math.round(performance.now() - startedAt)

  const totalRows = rows.length
  const limitedRows = rows.slice(0, MAX_ROWS)

  return {
    id: query.id,
    title: query.title,
    sql: query.sql,
    columns: fields.map((field) => ({ name: field.name, type: field.type })),
    rows: limitedRows,
    rowCount: limitedRows.length,
    totalRows,
    truncated: totalRows > MAX_ROWS,
    durationMs,
    ranAt: new Date().toISOString(),
  }
}
