import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Course from './Course.jsx'
import { getCourse, getLesson, solveExercise } from '../api/client.js'
import { loadProgress } from '../lib/courseProgress.js'

vi.mock('../api/client.js', () => ({
  getCourse: vi.fn(),
  getLesson: vi.fn(),
  solveExercise: vi.fn(),
  answerQuiz: vi.fn(),
  getExerciseSolution: vi.fn(),
}))

const MODULES = Array.from({ length: 9 }, (_, index) => ({
  id: `m${index + 1}`,
  title: `Module ${index + 1}`,
  summary: '',
  lessons: [
    {
      id: `m${index + 1}-l1`,
      title: `Bài ${index + 1}`,
      goal: '',
      exerciseCount: 1,
    },
  ],
}))

const playMock = vi.fn()

beforeEach(() => {
  localStorage.clear()
  playMock.mockClear()

  vi.mocked(getCourse).mockResolvedValue(MODULES)
  vi.mocked(getLesson).mockImplementation(async (id) => {
    const moduleId = id.split('-')[0]
    const module = MODULES.find((item) => item.id === moduleId)

    return {
      ok: true,
      module: { id: module.id, title: module.title, summary: '' },
      lesson: {
        id,
        title: `Bài học ${id}`,
        goal: 'Viết truy vấn đúng.',
        blocks: [{ type: 'p', text: `Nội dung ${id}.` }],
        exercises: [
          {
            id: `${id}-ex1`,
            type: 'sql',
            title: 'Bài tập SQL đầu tiên',
            prompt: 'Trả về một dòng một cột n.',
            outputColumns: ['n'],
            hints: ['Gợi ý 1', 'Gợi ý 2', 'Gợi ý 3'],
          },
        ],
      },
    }
  })
  vi.mocked(solveExercise).mockResolvedValue({
    ok: true,
    correct: true,
    feedback: {
      reason: null,
      expectedRowCount: 1,
      actualRowCount: 1,
      missingCount: 0,
      extraCount: 0,
      samples: { missing: [], extra: [] },
    },
    user: {
      columns: [{ name: 'n', type: 3 }],
      rows: [{ n: 1 }],
      rowCount: 1,
    },
    expectedRowCount: 1,
  })
})

describe('Course', () => {
  it('render lộ trình 9 module và chuyển giữa 3 khu vực của bài', async () => {
    render(<Course play={playMock} />)

    expect((await screen.findAllByText('Module 1')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Module 9').length).toBeGreaterThan(0)
    expect(screen.getByText('SQL Thực Chiến cho Data')).toBeTruthy()

    fireEvent.click(await screen.findByRole('button', { name: /Bài 1/ }))
    expect(await screen.findByText('Nội dung m1-l1.')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Làm bài' }))
    expect(await screen.findByText('Bài tập SQL đầu tiên')).toBeTruthy()
    expect(screen.getByLabelText('SQL của bạn')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Kết quả' }))
    expect(await screen.findByText(/Chưa hoàn thành/)).toBeTruthy()
  })

  it('chấm đúng hiện Chính xác và lưu tiến độ vào localStorage', async () => {
    render(<Course play={playMock} />)
    fireEvent.click(await screen.findByRole('button', { name: /Bài 1/ }))
    await screen.findByText('Nội dung m1-l1.')

    fireEvent.click(screen.getByRole('tab', { name: 'Làm bài' }))
    fireEvent.change(await screen.findByLabelText('SQL của bạn'), {
      target: { value: 'SELECT 1 AS n;' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chạy & chấm' }))

    expect(await screen.findByText('Chính xác')).toBeTruthy()
    expect(solveExercise).toHaveBeenCalledWith('m1-l1-ex1', 'SELECT 1 AS n;')
    expect(playMock).toHaveBeenCalledWith('success')

    const saved = loadProgress()
    expect(saved.exercises['m1-l1-ex1'].correct).toBe(true)
    expect(saved.exercises['m1-l1-ex1'].attempts).toBe(1)
  })

  it('bài tập đã pass hiện dấu hoàn thành trên lộ trình', async () => {
    render(<Course play={playMock} />)
    fireEvent.click(await screen.findByRole('button', { name: /Bài 1/ }))
    await screen.findByText('Nội dung m1-l1.')

    fireEvent.click(screen.getByRole('tab', { name: 'Làm bài' }))
    fireEvent.change(await screen.findByLabelText('SQL của bạn'), {
      target: { value: 'SELECT 1 AS n;' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chạy & chấm' }))
    await screen.findByText('Chính xác')

    const lessonButton = screen.getAllByRole('button').find((button) =>
      button.textContent.includes('Bài 1'),
    )

    expect(lessonButton.getAttribute('data-passed')).toBe('true')
  })
})
