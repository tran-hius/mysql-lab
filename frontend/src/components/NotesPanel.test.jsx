import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NotesPanel from './NotesPanel.jsx'
import { loadNote } from '../lib/notes.js'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('NotesPanel', () => {
  it('tự lưu sau 600ms và còn nguyên khi mount lại', () => {
    const first = render(<NotesPanel lessonId="m1-l1" />)

    fireEvent.change(screen.getByLabelText('Ghi chú của bạn'), {
      target: { value: 'NULL không bằng NULL.' },
    })

    expect(loadNote('m1-l1')).toBe('')

    vi.advanceTimersByTime(600)
    expect(loadNote('m1-l1')).toBe('NULL không bằng NULL.')

    first.unmount()
    render(<NotesPanel lessonId="m1-l1" />)

    expect(screen.getByLabelText('Ghi chú của bạn').value).toBe('NULL không bằng NULL.')
  })

  it('ghi chú tách riêng theo từng bài', () => {
    render(<NotesPanel lessonId="m1-l2" />)
    fireEvent.change(screen.getByLabelText('Ghi chú của bạn'), { target: { value: 'Bài 2' } })
    vi.advanceTimersByTime(600)

    expect(loadNote('m1-l2')).toBe('Bài 2')
    expect(loadNote('m1-l1')).toBe('')
  })

  it('hiện số ký tự đã gõ', () => {
    render(<NotesPanel lessonId="m1-l1" />)
    fireEvent.change(screen.getByLabelText('Ghi chú của bạn'), { target: { value: 'abcd' } })

    expect(screen.getByText(/4 ký tự/)).toBeTruthy()
  })
})
