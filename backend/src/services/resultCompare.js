const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;
const MAX_SAMPLES = 3;
const TOLERANCE = 0.01;

function normalize(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && NUMERIC_STRING.test(trimmed)) return Number(trimmed);
    return trimmed;
  }

  return String(value);
}

function sameValue(a, b) {
  if (a === null || b === null) return a === b;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= TOLERANCE;
  }
  return a === b;
}

function toMatrix({ columns, rows }) {
  return rows.map((row) => columns.map((column) => normalize(row[column.name])));
}

function sameRow(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => sameValue(value, b[index]));
}

function pickSamples(rows) {
  return rows.slice(0, MAX_SAMPLES);
}

function makeResult(expected, actual, reason, { missing = [], extra = [] } = {}) {
  return {
    correct: reason === null,
    reason,
    expectedRowCount: expected.rows.length,
    actualRowCount: actual.rows.length,
    missing: pickSamples(missing),
    extra: pickSamples(extra),
    missingCount: missing.length,
    extraCount: extra.length,
  };
}

function sameRowIgnoringOrder(a, b) {
  if (a.length !== b.length) return false;

  const used = new Array(b.length).fill(false);
  return a.every((value) => {
    const index = b.findIndex((candidate, position) => !used[position] && sameValue(value, candidate));
    if (index === -1) return false;
    used[index] = true;
    return true;
  });
}

function rowsMatchIgnoringColumnOrder(expectedRows, actualRows) {
  if (expectedRows.length !== actualRows.length) return false;

  const used = new Array(actualRows.length).fill(false);
  return expectedRows.every((expectedRow) => {
    const index = actualRows.findIndex(
      (actualRow, position) => !used[position] && sameRowIgnoringOrder(expectedRow, actualRow),
    );
    if (index === -1) return false;
    used[index] = true;
    return true;
  });
}

/**
 * So kết quả người học với đáp án.
 * - Mặc định so multiset (thứ tự không quan trọng).
 * - orderMatters: true thì so theo vị trí.
 * - Số cột phải khớp; tên cột/alias không quan trọng (so theo vị trí).
 */
export function compareResults(expected, actual, { orderMatters = false } = {}) {
  const expectedColumns = expected.columns?.length ?? 0;
  const actualColumns = actual.columns?.length ?? 0;

  if (expectedColumns !== actualColumns) {
    return makeResult(expected, actual, 'COLUMN_COUNT');
  }

  const expectedRows = toMatrix(expected);
  const actualRows = toMatrix(actual);

  if (orderMatters) {
    const limit = Math.min(expectedRows.length, actualRows.length);

    for (let index = 0; index < limit; index += 1) {
      if (!sameRow(expectedRows[index], actualRows[index])) {
        return makeResult(expected, actual, 'ORDER', {
          missing: [expectedRows[index]],
          extra: [actualRows[index]],
        });
      }
    }

    if (expectedRows.length !== actualRows.length) {
      return makeResult(expected, actual, 'ROW_COUNT', {
        missing: expectedRows.slice(limit),
        extra: actualRows.slice(limit),
      });
    }

    return makeResult(expected, actual, null);
  }

  const used = new Array(actualRows.length).fill(false);
  const missing = [];

  for (const expectedRow of expectedRows) {
    const matchIndex = actualRows.findIndex(
      (actualRow, index) => !used[index] && sameRow(expectedRow, actualRow),
    );

    if (matchIndex === -1) {
      missing.push(expectedRow);
    } else {
      used[matchIndex] = true;
    }
  }

  const extra = actualRows.filter((row, index) => !used[index]);

  if (missing.length === 0 && extra.length === 0) {
    return makeResult(expected, actual, null);
  }

  if (rowsMatchIgnoringColumnOrder(expectedRows, actualRows)) {
    return makeResult(expected, actual, 'COLUMN_COUNT');
  }

  return makeResult(expected, actual, 'ROW_COUNT', { missing, extra });
}
