import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FinalExam from './FinalExam.jsx'
import { getExam, submitExam } from '../api/client.js'

vi.mock('../api/client.js', () => ({
  getExam: vi.fn(),
  submitExam: vi.fn(),
}))

const examItems = [
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `exam-s${index + 1}`,
    type: 'sql',
    title: `Câu SQL ${index + 1}`,
    prompt: 'Viết truy vấn.',
    outputColumns: ['n'],
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `exam-q${index + 1}`,
    type: 'quiz',
    title: `Câu quiz ${index + 1}`,
    prompt: 'Chọn đáp án.',
    options: ['A', 'B', 'C', 'D'],
  })),
]

const playMock = vi.fn()

function answerEverything() {
  for (const textarea of screen.getAllByRole('textbox')) {
    fireEvent.change(textarea, { target: { value: 'SELECT 1 AS n;' } })
  }
  for (const radio of screen.getAllByRole('radio')) {
    if (radio.value === '0') fireEvent.click(radio)
  }
}

beforeEach(() => {
  playMock.mockClear()
  vi.mocked(getExam).mockResolvedValue({
    ok: true,
    title: 'Bài thi cuối khóa',
    passScore: 80,
    items: examItems,
  })
})

describe('FinalExam', () => {
  it('nộp đủ 12 câu và hiện điểm đạt', async () => {
    vi.mocked(submitExam).mockResolvedValue({
      ok: true,
      score: 92,
      passed: true,
      correctCount: 11,
      total: 12,
      items: [],
    })

    render(<FinalExam play={playMock} />)
    expect(await screen.findByText('Bài thi cuối khóa')).toBeTruthy()

    answerEverything()
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('92/100')).toBeTruthy()
    expect(screen.getByText('Đạt')).toBeTruthy()

    const [submitted] = vi.mocked(submitExam).mock.calls[0]
    expect(submitted).toHaveLength(12)
    expect(submitted[0]).toMatchObject({ id: 'exam-s1', sql: 'SELECT 1 AS n;' })
    expect(submitted[8]).toMatchObject({ id: 'exam-q1', choice: 0 })
  })

  it('hiện chưa đạt và cho làm lại', async () => {
    vi.mocked(submitExam).mockResolvedValue({
      ok: true,
      score: 67,
      passed: false,
      correctCount: 8,
      total: 12,
      items: [],
    })

    render(<FinalExam play={playMock} />)
    await screen.findByText('Bài thi cuối khóa')

    answerEverything()
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('67/100')).toBeTruthy()
    expect(screen.getByText('Chưa đạt')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Làm lại' }))

    for (const textarea of screen.getAllByRole('textbox')) {
      expect(textarea.value).toBe('')
    }
    expect(screen.queryByText('67/100')).toBeNull()
  })
})
