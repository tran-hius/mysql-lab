import { describe, expect, it } from 'vitest'
import { formatCell, formatDateTime, formatNumber } from './format.js'

describe('formatNumber', () => {
  it('định dạng theo vi-VN', () => {
    expect(formatNumber(1234)).toBe('1.234')
    expect(formatNumber(1859208.9)).toBe('1.859.208,9')
  })
})

describe('formatCell', () => {
  it('NULL thành gạch ngang', () => {
    expect(formatCell(null, 3)).toBe('—')
    expect(formatCell(undefined, 3)).toBe('—')
  })

  it('DECIMAL dạng chuỗi được format như số', () => {
    expect(formatCell('1859208.90', 246)).toBe('1.859.208,9')
  })

  it('chuỗi tháng giữ nguyên', () => {
    expect(formatCell('2025-01', 253)).toBe('2025-01')
  })

  it('số nguyên có dấu phân cách', () => {
    expect(formatCell(64, 3)).toBe('64')
    expect(formatCell(1234, 3)).toBe('1.234')
  })
})

describe('formatDateTime', () => {
  it('đổi ISO sang giờ địa phương dạng ngắn', () => {
    expect(formatDateTime('2026-11-11T08:30:00.000Z')).toMatch(/\d{1,2}:\d{2}/)
  })
})
