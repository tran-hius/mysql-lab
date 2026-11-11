import test from 'node:test'
import assert from 'node:assert/strict'
import { assertPracticeSql } from '../src/services/practiceGuard.js'

test('guard cho phép SELECT, WITH và EXPLAIN khi được bật', () => {
  assert.doesNotThrow(() => assertPracticeSql('SELECT 1'))
  assert.doesNotThrow(() => assertPracticeSql('WITH t AS (SELECT 1) SELECT * FROM t;'))
  assert.doesNotThrow(() => assertPracticeSql('EXPLAIN SELECT * FROM orders', { allowExplain: true }))
})

test('guard chặn câu lệnh ghi và nhiều câu', () => {
  for (const sql of [
    'DELETE FROM orders',
    'UPDATE orders SET status = "cancelled"',
    'WITH t AS (SELECT 1) DELETE FROM orders',
    'SELECT 1; SELECT 2',
    'SELECT 1; DROP TABLE orders',
    "SELECT * FROM orders INTO OUTFILE '/tmp/x'",
    "SELECT LOAD_FILE('/etc/passwd')",
    'SELECT SLEEP(5)',
    'SELECT BENCHMARK(1000000, MD5("x"))',
  ]) {
    assert.throws(() => assertPracticeSql(sql), { code: 'SQL_NOT_ALLOWED' }, sql)
  }
})

test('guard cho phép REPLACE() và dấu ; trong chuỗi', () => {
  assert.doesNotThrow(() =>
    assertPracticeSql("SELECT REPLACE(name, 'a', 'b') FROM customers"),
  )
  assert.doesNotThrow(() => assertPracticeSql("SELECT 'a;b' AS value"))
  assert.doesNotThrow(() => assertPracticeSql('SELECT "x;y" AS value'))
})

test('guard không cho EXPLAIN nếu không bật allowExplain', () => {
  assert.throws(() => assertPracticeSql('EXPLAIN SELECT * FROM orders'), { code: 'SQL_NOT_ALLOWED' })
})
