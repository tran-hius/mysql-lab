import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runQuery } from './api/client.js'
import App from './App.jsx'

const { playMock } = vi.hoisted(() => ({ playMock: vi.fn() }))

vi.mock('./api/client.js', () => ({
  getQueries: vi.fn(async () => [
    { id: 'a', title: 'Truy vấn A', group: 'Nhóm 1', description: '' },
  ]),
  runQuery: vi.fn(async () => {
    throw new Error('Không kết nối được MySQL.')
  }),
  getHealth: vi.fn(async () => ({ ok: false, database: { status: 'disconnected' } })),
  getCourse: vi.fn(async () => []),
  getLesson: vi.fn(async () => null),
  solveExercise: vi.fn(),
  answerQuiz: vi.fn(),
  getExerciseSolution: vi.fn(),
}))

vi.mock('./hooks/useSound.js', () => ({
  useSound: () => ({ enabled: true, toggle: vi.fn(), play: playMock }),
}))

const successResult = {
  ok: true,
  id: 'a',
  title: 'Truy vấn A',
  sql: 'SELECT 1;',
  columns: [{ name: 'ten', type: 253 }],
  rows: [{ ten: 'An' }],
  rowCount: 1,
  totalRows: 1,
  truncated: false,
  durationMs: 3,
  ranAt: '2026-11-11T08:30:00.000Z',
}

beforeEach(() => {
  playMock.mockClear()
})

describe('App', () => {
  it('hiện lỗi và bỏ bảng cũ khi truy vấn thất bại', async () => {
    vi.mocked(runQuery).mockResolvedValueOnce(successResult)

    render(<App />)
    const item = await screen.findByRole('button', { name: 'Truy vấn A' })

    item.click()
    expect(await screen.findByRole('table')).toBeTruthy()

    item.click()
    expect(await screen.findByText(/Không kết nối được MySQL/)).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
  })

  it('không phát âm thanh "run" sau khi đã có kết quả', async () => {
    vi.mocked(runQuery).mockResolvedValueOnce(successResult)

    render(<App />)
    const item = await screen.findByRole('button', { name: 'Truy vấn A' })
    item.click()

    expect(await screen.findByRole('table')).toBeTruthy()
    await waitFor(() => expect(playMock).toHaveBeenCalledWith('success'))
    await new Promise((resolve) => setTimeout(resolve, 120))

    expect(playMock.mock.calls.filter(([name]) => name === 'run')).toHaveLength(0)
  })
})
