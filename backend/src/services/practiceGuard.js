const WRITE_KEYWORDS =
  /\b(insert|update|delete|drop|alter|truncate|create|rename|grant|revoke|lock\s+tables|unlock\s+tables)\b/i;
const DANGEROUS =
  /\b(into\s+(out|dump)file|outfile|dumpfile|load_file\s*\(|sleep\s*\(|benchmark\s*\(|get_lock\s*\(|release_lock\s*\()/i;
const EXECUTABLE_COMMENT = /\/\*!/;

function reject() {
  const error = new Error('Chỉ cho phép một câu truy vấn đọc dữ liệu.');
  error.code = 'SQL_NOT_ALLOWED';
  throw error;
}

/**
 * Guard lớp phụ. Quyền MySQL của `lab_reader` mới là hàng rào thật.
 * Chỉ nhận một câu SELECT/WITH (sandbox cho thêm EXPLAIN).
 */
export function assertPracticeSql(sql, { allowExplain = false } = {}) {
  if (typeof sql !== 'string' || !sql.trim()) reject();

  const statement = sql.trim().replace(/;+\s*$/, '');
  const lead = allowExplain ? /^(select|with|explain)\b/i : /^(select|with)\b/i;

  if (!lead.test(statement)) reject();

  // Bỏ literal/identifier trong dấu nháy trước khi kiểm tra `;` và từ khóa ghi,
  // để `SELECT REPLACE(name, 'a', 'b')` hay chuỗi chứa `;` vẫn hợp lệ.
  const code = statement
    .replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
    .replace(/"(?:[^"\\]|\\.|"")*"/g, '""')
    .replace(/`(?:[^`]|``)*`/g, '``');

  if (code.includes(';')) reject();
  if (WRITE_KEYWORDS.test(code)) reject();
  if (DANGEROUS.test(statement)) reject();
  if (EXECUTABLE_COMMENT.test(statement)) reject();
}
