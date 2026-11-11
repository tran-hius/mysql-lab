import test from 'node:test'
import assert from 'node:assert/strict'
import { compareResults } from '../src/services/resultCompare.js'

const result = (columns, rows) => ({ columns, rows })

const COLUMNS = [
  { name: 'ten', type: 253 },
  { name: 'tien', type: 246 },
]

test('so multiset bỏ qua thứ tự dòng', () => {
  const expected = result(COLUMNS, [
    { ten: 'An', tien: '10.00' },
    { ten: 'Binh', tien: '20.00' },
  ])
  const actual = result(COLUMNS, [
    { ten: 'Binh', tien: '20.00' },
    { ten: 'An', tien: '10.00' },
  ])

  const comparison = compareResults(expected, actual)
  assert.equal(comparison.correct, true)
  assert.equal(comparison.reason, null)
})

test('orderMatters so theo vị trí', () => {
  const expected = result(COLUMNS, [
    { ten: 'An', tien: '10.00' },
    { ten: 'Binh', tien: '20.00' },
  ])
  const actual = result(COLUMNS, [
    { ten: 'Binh', tien: '20.00' },
    { ten: 'An', tien: '10.00' },
  ])

  const comparison = compareResults(expected, actual, { orderMatters: true })
  assert.equal(comparison.correct, false)
  assert.equal(comparison.reason, 'ORDER')
})

test('NULL bằng NULL và số lệch ≤ 0.01 được chấp nhận', () => {
  const expected = result(COLUMNS, [{ ten: null, tien: '1859208.90' }])
  const actual = result(COLUMNS, [{ ten: null, tien: '1859208.905' }])

  assert.equal(compareResults(expected, actual).correct, true)
})

test('số lệch quá 0.01 bị coi là khác', () => {
  const expected = result(COLUMNS, [{ ten: 'An', tien: '100.00' }])
  const actual = result(COLUMNS, [{ ten: 'An', tien: '100.02' }])

  const comparison = compareResults(expected, actual)
  assert.equal(comparison.correct, false)
  assert.equal(comparison.reason, 'ROW_COUNT')
})

test('thiếu dòng trả về missing, thừa dòng trả về extra', () => {
  const expected = result(COLUMNS, [
    { ten: 'An', tien: '10.00' },
    { ten: 'Binh', tien: '20.00' },
  ])
  const actual = result(COLUMNS, [{ ten: 'An', tien: '10.00' }])

  const comparison = compareResults(expected, actual)
  assert.equal(comparison.correct, false)
  assert.equal(comparison.missingCount, 1)
  assert.equal(comparison.extraCount, 0)
  assert.equal(comparison.missing.length, 1)
  assert.equal(comparison.expectedRowCount, 2)
  assert.equal(comparison.actualRowCount, 1)
})

test('sai số cột báo COLUMN_COUNT', () => {
  const expected = result(COLUMNS, [{ ten: 'An', tien: '10.00' }])
  const actual = result([{ name: 'ten', type: 253 }], [{ ten: 'An' }])

  const comparison = compareResults(expected, actual)
  assert.equal(comparison.correct, false)
  assert.equal(comparison.reason, 'COLUMN_COUNT')
})
