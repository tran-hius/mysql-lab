import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const MANIFEST = [
  {
    id: 'overview',
    file: 'overview.sql',
    group: 'Doanh thu',
    title: 'Tổng quan kinh doanh',
    description: 'Tổng doanh thu thuần, số đơn, số khách và giá trị trung bình mỗi đơn.',
  },
  {
    id: 'monthly-revenue',
    file: 'monthly-revenue.sql',
    group: 'Doanh thu',
    title: 'Doanh thu theo tháng',
    description: 'Doanh thu, số đơn và số khách theo từng tháng bằng GROUP BY.',
  },
  {
    id: 'category-share',
    file: 'category-share.sql',
    group: 'Doanh thu',
    title: 'Tỷ trọng theo danh mục',
    description: 'Doanh thu và phần trăm đóng góp của từng danh mục bằng window function.',
  },
  {
    id: 'monthly-growth',
    file: 'monthly-growth.sql',
    group: 'Doanh thu',
    title: 'Tăng trưởng theo tháng',
    description: 'So sánh doanh thu mỗi tháng với tháng trước bằng LAG().',
  },
  {
    id: 'top-products',
    file: 'top-products.sql',
    group: 'Sản phẩm',
    title: 'Top 10 sản phẩm',
    description: 'Sản phẩm bán chạy theo doanh thu. Nhóm theo tên vì 40 mã chỉ có 21 tên.',
  },
  {
    id: 'product-rank',
    file: 'product-rank.sql',
    group: 'Sản phẩm',
    title: 'Xếp hạng trong danh mục',
    description: 'Top 3 sản phẩm mỗi danh mục bằng RANK() OVER (PARTITION BY).',
  },
  {
    id: 'top-customers',
    file: 'top-customers.sql',
    group: 'Khách hàng',
    title: 'Top khách hàng',
    description: 'Khách chi nhiều nhất, nhóm theo customer_id và hiện kèm mã khách.',
  },
  {
    id: 'above-average',
    file: 'above-average.sql',
    group: 'Khách hàng',
    title: 'Chi tiêu trên trung bình',
    description: 'Khách có tổng chi lớn hơn mức trung bình, dùng subquery và HAVING.',
  },
  {
    id: 'customer-referee',
    file: 'customer-referee.sql',
    group: 'Bài tập',
    title: 'Khách không bị giới thiệu',
    description: 'Bài 584: referee_id IS NULL OR referee_id <> 2.',
  },
  {
    id: 'low-fat-recyclable',
    file: 'low-fat-recyclable.sql',
    group: 'Bài tập',
    title: 'Ít béo và tái chế',
    description: 'Bài 1757: lọc sản phẩm low_fats = Y và recyclable = Y.',
  },
]

const loaded = MANIFEST.map(({ file, ...meta }) => ({
  ...meta,
  sql: readFileSync(join(here, file), 'utf8').trim(),
}))

export function listQueries() {
  return loaded.map(({ sql, ...meta }) => meta)
}

export function getQuery(id) {
  return loaded.find((query) => query.id === id) ?? null
}
