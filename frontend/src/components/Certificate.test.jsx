import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Certificate from './Certificate.jsx'
import { emptyProgress, recordExercise, recordExam } from '../lib/courseProgress.js'
import { loadCertificate } from '../lib/certificate.js'

const modules = [
  {
    id: 'm1',
    title: 'Module 1',
    lessons: [{ id: 'm1-l1', title: 'Bài 1', exerciseCount: 1 }],
  },
]

function completeCourse(score) {
  const progress = recordExercise(emptyProgress(), {
    lessonId: 'm1-l1',
    exerciseId: 'm1-l1-ex1',
    correct: true,
  })
  return recordExam(progress, { score })
}

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('Certificate', () => {
  it('khóa khi chưa đủ điều kiện và nêu lý do', () => {
    render(<Certificate course={modules} progress={emptyProgress()} />)

    expect(screen.getByText(/Chưa đủ điều kiện chứng chỉ/)).toBeTruthy()
    expect(screen.queryByLabelText('Họ tên trên chứng chỉ')).toBeNull()
  })

  it('cấp chứng chỉ khi đã pass khóa và thi >= 80', () => {
    render(<Certificate course={modules} progress={completeCourse(90)} />)

    fireEvent.change(screen.getByLabelText('Họ tên trên chứng chỉ'), {
      target: { value: 'Nguyễn Văn An' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cấp chứng chỉ' }))

    expect(screen.getByText(/SQLLAB-2026-/)).toBeTruthy()
    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0)
    expect(loadCertificate().holderName).toBe('Nguyễn Văn An')
  })

  it('tải SVG bằng URL.createObjectURL', () => {
    render(<Certificate course={modules} progress={completeCourse(88)} />)

    fireEvent.change(screen.getByLabelText('Họ tên trên chứng chỉ'), {
      target: { value: 'Trần Thị Bình' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cấp chứng chỉ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tải SVG' }))

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })
})
