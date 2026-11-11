import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('./api/client.js', () => ({
  getQueries: vi.fn(async () => [
    { id: 'a', title: 'Truy vấn A', group: 'Nhóm 1', description: '' },
  ]),
  runQuery: vi.fn(async () => {
    throw new Error('Không kết nối được MySQL.')
  }),
  getHealth: vi.fn(async () => ({ ok: false, database: { status: 'disconnected' } })),
}))

describe('App', () => {
  it('hiện lỗi và không giữ bảng khi truy vấn thất bại', async () => {
    render(<App />)
    const item = await screen.findByRole('button', { name: 'Truy vấn A' })
    item.click()
    expect(await screen.findByText(/Không kết nối được MySQL/)).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
  })
})
