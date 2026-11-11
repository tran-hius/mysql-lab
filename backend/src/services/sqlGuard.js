export function assertReadOnly(sql) {
  const statement = String(sql).trim().replace(/;+\s*$/, '')
  const allowed = /^(select|with)\b/i.test(statement) && !statement.includes(';')

  if (!allowed) {
    const error = new Error('Chỉ cho phép một câu SELECT/WITH duy nhất')
    error.code = 'SQL_NOT_ALLOWED'
    throw error
  }
}
