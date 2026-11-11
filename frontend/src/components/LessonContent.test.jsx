import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LessonContent from './LessonContent.jsx'

const blocks = [
  { type: 'p', text: 'Đoạn mở đầu của bài học.' },
  { type: 'h3', text: 'Tiêu đề phụ' },
  { type: 'list', items: ['Gạch đầu dòng một', 'Gạch đầu dòng hai'] },
  { type: 'steps', items: ['Bước thứ nhất', 'Bước thứ hai'] },
  { type: 'code', sql: 'SELECT id FROM orders;' },
  { type: 'table', headers: ['Cột A', 'Cột B'], rows: [['1', '2']] },
  { type: 'callout', tone: 'warn', title: 'Bẫy quen thuộc', text: 'NULL không bằng NULL.' },
]

describe('LessonContent', () => {
  it('render đủ các loại khối có cấu trúc', () => {
    render(<LessonContent blocks={blocks} />)

    expect(screen.getByText('Đoạn mở đầu của bài học.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Tiêu đề phụ' })).toBeTruthy()
    expect(screen.getByText('Gạch đầu dòng một')).toBeTruthy()
    expect(screen.getByText('Bước thứ nhất')).toBeTruthy()
    expect(screen.getByText('SELECT id FROM orders;')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Cột A' })).toBeTruthy()
    expect(screen.getByText('Bẫy quen thuộc')).toBeTruthy()
    expect(screen.getByText('NULL không bằng NULL.')).toBeTruthy()

    expect(document.querySelector('ol')).toBeTruthy()
    expect(document.querySelector('.callout.is-warn')).toBeTruthy()
  })

  it('hiển thị HTML thô dưới dạng chữ, không tạo phần tử', () => {
    render(
      <LessonContent
        blocks={[{ type: 'p', text: '<script>alert("xss")</script><b>đậm</b>' }]}
      />,
    )

    const paragraph = screen.getByText(/<script>alert\("xss"\)<\/script>/)

    expect(paragraph.querySelector('script')).toBeNull()
    expect(paragraph.querySelector('b')).toBeNull()
  })

  it('bỏ qua khối lạ mà không làm vỡ trang', () => {
    render(<LessonContent blocks={[{ type: 'khong-ton-tai', text: 'x' }, ...blocks]} />)
    expect(screen.getByText('Đoạn mở đầu của bài học.')).toBeTruthy()
  })
})
