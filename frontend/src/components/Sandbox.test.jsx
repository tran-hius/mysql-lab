import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Sandbox from './Sandbox.jsx'
import { getSchema, runSandbox } from '../api/client.js'

vi.mock('../api/client.js', () => ({
  getSchema: vi.fn(),
  runSandbox: vi.fn(),
}))

const schema = {
  database: 'shop',
  tables: [
    {
      name: 'customers',
      rowCount: 12,
      columns: [
        { name: 'id', type: 'int', nullable: false, key: 'PRI' },
        { name: 'name', type: 'varchar(120)', nullable: false, key: '' },
      ],
      sampleRows: [{ id: 1, name: 'An' }],
    },
  ],
}

const playMock = vi.fn()

beforeEach(() => {
  playMock.mockClear()
  vi.mocked(getSchema).mockResolvedValue(schema)
  vi.mocked(runSandbox).mockResolvedValue({
    ok: true,
    columns: [{ name: 'n', type: 3 }],
    rows: [{ n: 1 }],
    rowCount: 1,
    totalRows: 1,
    truncated: false,
    durationMs: 4,
  })
})

describe('Sandbox', () => {
  it('chạy SQL và hiện bảng kết quả', async () => {
    render(<Sandbox play={playMock} />)

    expect(await screen.findByText('customers')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('SQL của bạn'), {
      target: { value: 'SELECT 1 AS n;' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chạy' }))

    expect(await screen.findByRole('table')).toBeTruthy()
    expect(runSandbox).toHaveBeenCalledWith('SELECT 1 AS n;')
    expect(screen.getByRole('columnheader', { name: 'n' })).toBeTruthy()
    expect(playMock).toHaveBeenCalledWith('run')
  })

  it('hiện message khi SQL lỗi', async () => {
    vi.mocked(runSandbox).mockRejectedValue(
      new Error("Table 'shop.khachhang' doesn't exist"),
    )

    render(<Sandbox play={playMock} />)
    await screen.findByText('customers')

    fireEvent.change(screen.getByLabelText('SQL của bạn'), {
      target: { value: 'SELECT * FROM khachhang;' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chạy' }))

    expect(await screen.findByText(/doesn't exist/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(playMock).toHaveBeenCalledWith('error')
  })

  it('mở bảng trong schema explorer để xem cột và kiểu dữ liệu', async () => {
    render(<Sandbox play={playMock} />)

    fireEvent.click(await screen.findByRole('button', { name: /customers/ }))

    expect(await screen.findByText('varchar(120)')).toBeTruthy()
    expect(screen.getByText('PRI')).toBeTruthy()
    expect(screen.getByText(/12 dòng/)).toBeTruthy()
  })
})
