import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ResultTable from './ResultTable.jsx'

describe('ResultTable', () => {
  it('hiện NULL là gạch ngang và format số', () => {
    render(
      <ResultTable
        columns={[
          { name: 'ten', type: 253 },
          { name: 'tien', type: 246 },
        ]}
        rows={[
          { ten: 'An', tien: '1859208.90' },
          { ten: null, tien: null },
        ]}
      />,
    )
    expect(screen.getByText('1.859.208,9')).toBeTruthy()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('hiện thông báo khi không có dòng nào', () => {
    render(<ResultTable columns={[{ name: 'ten', type: 253 }]} rows={[]} />)
    expect(screen.getByText('Truy vấn không trả về dòng nào.')).toBeTruthy()
  })
})
