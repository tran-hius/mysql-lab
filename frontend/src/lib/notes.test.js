import { beforeEach, describe, expect, it } from 'vitest'
import { exportNotes, loadNote, saveNote } from './notes.js'

const course = [
  {
    id: 'm1',
    title: 'Nền tảng thực chiến',
    lessons: [
      { id: 'm1-l1', title: 'SELECT và alias' },
      { id: 'm1-l2', title: 'WHERE và NULL' },
    ],
  },
  {
    id: 'm2',
    title: 'Tổng hợp và nhóm',
    lessons: [{ id: 'm2-l1', title: 'Aggregate' }],
  },
]

beforeEach(() => {
  localStorage.clear()
})

describe('note', () => {
  it('lưu, đọc và ghi đè', () => {
    expect(loadNote('m1-l1')).toBe('')

    saveNote('m1-l1', 'Alias không dùng được trong WHERE.')
    expect(loadNote('m1-l1')).toBe('Alias không dùng được trong WHERE.')

    saveNote('m1-l1', 'Đã sửa lại ghi chú.')
    expect(loadNote('m1-l1')).toBe('Đã sửa lại ghi chú.')
  })

  it('xoá key khi nội dung rỗng', () => {
    saveNote('m1-l1', 'tạm')
    saveNote('m1-l1', '   ')

    expect(loadNote('m1-l1')).toBe('')
    expect(localStorage.getItem('mysql-lab:notes:m1-l1')).toBeNull()
  })
})

describe('exportNotes', () => {
  it('xuất markdown có tiêu đề module, bài và nội dung', () => {
    saveNote('m1-l1', 'Ghi chú bài 1')
    saveNote('m2-l1', 'Ghi chú bài 3')

    const markdown = exportNotes(course)

    expect(markdown).toContain('# Ghi chú khóa học MySQL Lab')
    expect(markdown).toContain('## Nền tảng thực chiến')
    expect(markdown).toContain('### SELECT và alias')
    expect(markdown).toContain('Ghi chú bài 1')
    expect(markdown).toContain('## Tổng hợp và nhóm')
    expect(markdown).not.toContain('### WHERE và NULL')
  })

  it('nêu rõ khi chưa có ghi chú', () => {
    expect(exportNotes(course)).toContain('Chưa có ghi chú')
  })
})
