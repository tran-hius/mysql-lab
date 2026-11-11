import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Sidebar from './Sidebar.jsx'

const queries = [
  { id: 'a', title: 'Truy vấn A', group: 'Nhóm 1', description: '' },
  { id: 'b', title: 'Truy vấn B', group: 'Nhóm 2', description: '' },
]

describe('Sidebar', () => {
  it('nhóm truy vấn theo group và đánh dấu mục đang chọn', () => {
    render(<Sidebar queries={queries} activeId="b" onSelect={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Nhóm 1' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Nhóm 2' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Truy vấn B' }).getAttribute('aria-current')).toBe('true')
  })
})
