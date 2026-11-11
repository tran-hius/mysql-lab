import { performance } from 'node:perf_hooks';
import { readerPool } from '../config/readerPool.js';

const DEFAULT_MAX_ROWS = 200;
const QUERY_TIMEOUT_MS = 3000;
const TIMEOUT_CODES = new Set(['PROTOCOL_SEQUENCE_TIMEOUT', 'ER_QUERY_TIMEOUT', 'ETIMEDOUT']);

function isTimeoutError(error) {
  return (
    TIMEOUT_CODES.has(error.code) ||
    error.errno === 3024 ||
    /timeout|max_execution_time/i.test(error.message ?? '')
  );
}

/**
 * Chạy SQL của người học trên reader pool. Không tự guard — route gọi guard trước.
 */
export async function runPracticeSql(sql, { maxRows = DEFAULT_MAX_ROWS } = {}) {
  const startedAt = performance.now();
  let rows;
  let fields;

  try {
    [rows, fields] = await readerPool.query({ sql, timeout: QUERY_TIMEOUT_MS });
  } catch (error) {
    if (isTimeoutError(error)) {
      const timeoutError = new Error('Truy vấn chạy quá lâu (giới hạn 3 giây).');
      timeoutError.code = 'QUERY_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }

  const durationMs = Math.round(performance.now() - startedAt);
  const allRows = Array.isArray(rows) ? rows : [];
  const limitedRows = allRows.slice(0, maxRows);

  return {
    columns: (fields ?? []).map((field) => ({ name: field.name, type: field.type })),
    rows: limitedRows,
    rowCount: limitedRows.length,
    totalRows: allRows.length,
    truncated: allRows.length > maxRows,
    durationMs,
  };
}
