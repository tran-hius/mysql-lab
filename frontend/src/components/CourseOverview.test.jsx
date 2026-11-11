import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CourseOverview from './CourseOverview.jsx'
import { emptyProgress, recordExercise, recordExam } from '../lib/courseProgress.js'

const modules = [
  {
    id: 'm1',
    title: 'Nền tảng',
    lessons: [{ id: 'm1-l1', title: 'Bài 1', exerciseCount: 1 }],
  },
  {
    id: 'm2',
    title: 'Tổng hợp',
    lessons: [{ id: 'm2-l1', title: 'Bài 2', exerciseCount: 1 }],
  },
]

function progressWith(score) {
  let progress = recordExercise(emptyProgress(), {
    lessonId: 'm1-l1',
    exerciseId: 'm1-l1-ex1',
    correct: true,
  })
  progress = recordExam(progress, { score })
  return progress
}

describe('CourseOverview', () => {
  it('hiện số liệu tổng và trạng thái pass/fail từng module', () => {
    render(
      <CourseOverview
        modules={modules}
        progress={progressWith(70)}
        onOpenLesson={vi.fn()}
        onStartExam={vi.fn()}
        onOpenCertificate={vi.fn()}
      />,
    )

    expect(screen.getByText('1/2 bài')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.getByText('70/100')).toBeTruthy()
    expect(screen.getByTestId('overview-m1').getAttribute('data-passed')).toBe('true')
    expect(screen.getByTestId('overview-m2').getAttribute('data-passed')).toBe('false')
    expect(screen.getByText(/Chưa đủ điều kiện chứng chỉ/)).toBeTruthy()
  })

  it('gọi hành động mở thi và mở chứng chỉ', () => {
    const onStartExam = vi.fn()
    const onOpenCertificate = vi.fn()

    render(
      <CourseOverview
        modules={modules}
        progress={progressWith(90)}
        onOpenLesson={vi.fn()}
        onStartExam={onStartExam}
        onOpenCertificate={onOpenCertificate}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Thi cuối khóa' }))
    expect(onStartExam).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Mở chứng chỉ' }))
    expect(onOpenCertificate).toHaveBeenCalledTimes(1)
  })
})
