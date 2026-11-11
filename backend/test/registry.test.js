import test from 'node:test'
import assert from 'node:assert/strict'
import { listQueries, getQuery } from '../src/queries/index.js'

test('registry có đủ 10 truy vấn với id duy nhất', () => {
  const queries = listQueries()
  assert.equal(queries.length, 10)
  assert.equal(new Set(queries.map((q) => q.id)).size, 10)
  for (const q of queries) {
    assert.ok(q.title && q.group && q.description, `thiếu metadata: ${q.id}`)
  }
})

test('listQueries không lộ SQL', () => {
  assert.ok(listQueries().every((q) => q.sql === undefined))
})

test('mọi SQL là một câu SELECT/WITH duy nhất', () => {
  for (const { id } of listQueries()) {
    const sql = getQuery(id).sql.trim().replace(/;+$/, '')
    assert.match(sql, /^(select|with)\b/i, id)
    assert.ok(!sql.includes(';'), id)
  }
})

test('getQuery trả null với id lạ', () => {
  assert.equal(getQuery('khong-ton-tai'), null)
})
