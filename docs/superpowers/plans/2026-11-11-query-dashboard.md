# Query Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay trang landing bằng bảng truy vấn: 10 câu SQL viết tay trong backend, chạy qua API, hiển thị kết quả trong giao diện navy/cam có âm thanh phản hồi.

**Architecture:** Backend giữ registry 10 file `.sql`, chạy qua `pool.query` với guard chỉ cho SELECT/WITH, trả `{columns, rows, rowCount, totalRows, truncated, durationMs, ranAt}`. Frontend React gọi 2 endpoint, hiển thị sidebar nhóm truy vấn, bảng kết quả, panel SQL, âm thanh Web Audio.

**Tech Stack:** Node 24, Express 5, mysql2, React 19, Vite 8, `node --test`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-11-query-dashboard-design.md`

## Global Constraints

- Chỉ chạy truy vấn trong registry; không nhận SQL từ client.
- Câu SQL phải bắt đầu bằng `SELECT` hoặc `WITH`, chỉ một câu, kết quả tối đa 500 dòng.
- Không thêm dependency runtime backend. Frontend chỉ thêm dev-dependency cho test.
- Màu: nền `#0E1620`, panel `#131E2B`, viền `#223044`, chữ `#E6EDF3`, chữ phụ `#8B9BAE`, nhấn `#F29111`, thành công `#3FB950`, lỗi `#F85149`.
- Font: Instrument Sans (UI) và IBM Plex Mono (SQL, số, metadata).
- Âm thanh mặc định bật, tắt được, lưu `localStorage` khoá `mysql-lab:sound`, chỉ tạo `AudioContext` sau thao tác đầu tiên.
- Nhóm khách theo `customer_id`, nhãn `MIN(customer_name) (#id)`.
- Nhóm sản phẩm theo `product_name`, giữ nguyên tên gõ sai.
- Kết nối DB đọc từ `backend/.env` (`DB_NAME=hocmysql`, user `lab_app`); không hard-code.

## Review Focus

- MySQL tắt giữa chừng → UI hiện lỗi và **không** giữ bảng cũ (test ở Task 6, kiểm tra tay ở Task 7).
- `DECIMAL` trả về dạng chuỗi → phải format theo kiểu số, không nối chuỗi thô (test ở Task 4).
- Ô `NULL` → hiện `—`, không hiện `null` (test ở Task 6).
- Hai khách trùng tên khác id → nhãn phải kèm `(#id)` để phân biệt (test ở Task 3).
- Trình duyệt chặn audio trước thao tác đầu → không được ném lỗi, âm thanh hoạt động từ click đầu tiên (test ở Task 5).

---

### Task 1: Registry truy vấn và 10 file SQL

**Files:**
- Create: `backend/src/queries/overview.sql`, `monthly-revenue.sql`, `category-share.sql`, `monthly-growth.sql`, `top-products.sql`, `product-rank.sql`, `top-customers.sql`, `above-average.sql`, `customer-referee.sql`, `low-fat-recyclable.sql`
- Create: `backend/src/queries/index.js`
- Test: `backend/test/registry.test.js`
- Modify: `backend/package.json` (thêm script `"test": "node --test"`)

**Interfaces:**
- Produces: `listQueries(): Array<{id,title,group,description}>`, `getQuery(id): {id,title,group,description,sql} | null`.

- [ ] **Step 1: Viết test thất bại**

```js
// backend/test/registry.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { listQueries, getQuery } from '../src/queries/index.js'

test('registry có đủ 10 truy vấn với id duy nhất', () => {
  const queries = listQueries()
  assert.equal(queries.length, 10)
  assert.equal(new Set(queries.map((q) => q.id)).size, 10)
  for (const q of queries) {
    assert.ok(q.title && q.group && q.description, `thiếu metadata: ${q.id}`)
  }
})

test('listQueries không lộ SQL', () => {
  assert.ok(listQueries().every((q) => q.sql === undefined))
})

test('mọi SQL là một câu SELECT/WITH duy nhất', () => {
  for (const { id } of listQueries()) {
    const sql = getQuery(id).sql.trim().replace(/;+$/, '')
    assert.match(sql, /^(select|with)\b/i, id)
    assert.ok(!sql.includes(';'), id)
  }
})

test('getQuery trả null với id lạ', () => {
  assert.equal(getQuery('khong-ton-tai'), null)
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd backend; npm test`
Expected: FAIL — `Cannot find module '../src/queries/index.js'`.

- [ ] **Step 3: Tạo 10 file SQL**

Nội dung chính xác (mỗi file một câu, kết thúc bằng `;`):

`overview.sql`
```sql
SELECT
  ROUND(SUM(net_sales), 2) AS tong_doanh_thu,
  COUNT(*) AS so_don,
  COUNT(DISTINCT customer_id) AS so_khach,
  ROUND(SUM(net_sales) / COUNT(*), 2) AS trung_binh_moi_don
FROM sales;
```

`monthly-revenue.sql`
```sql
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS thang,
  COUNT(*) AS so_don,
  COUNT(DISTINCT customer_id) AS so_khach,
  ROUND(SUM(net_sales), 2) AS doanh_thu
FROM sales
GROUP BY thang
ORDER BY thang;
```

`category-share.sql`
```sql
SELECT
  category AS danh_muc,
  ROUND(SUM(net_sales), 2) AS doanh_thu,
  COUNT(*) AS so_don,
  ROUND(100 * SUM(net_sales) / SUM(SUM(net_sales)) OVER (), 2) AS ty_trong_phan_tram
FROM sales
GROUP BY category
ORDER BY doanh_thu DESC;
```

`monthly-growth.sql`
```sql
WITH thang AS (
  SELECT DATE_FORMAT(created_at, '%Y-%m') AS thang, SUM(net_sales) AS doanh_thu
  FROM sales
  GROUP BY thang
)
SELECT
  thang,
  ROUND(doanh_thu, 2) AS doanh_thu,
  ROUND(LAG(doanh_thu) OVER (ORDER BY thang), 2) AS thang_truoc,
  ROUND(100 * (doanh_thu - LAG(doanh_thu) OVER (ORDER BY thang))
    / LAG(doanh_thu) OVER (ORDER BY thang), 2) AS tang_truong_phan_tram
FROM thang
ORDER BY thang;
```

`top-products.sql`
```sql
SELECT
  product_name AS san_pham,
  SUM(quantity) AS so_luong_ban,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS doanh_thu,
  ROUND(SUM(net_sales) / SUM(quantity), 2) AS gia_tri_trung_binh
FROM sales
GROUP BY product_name
ORDER BY doanh_thu DESC
LIMIT 10;
```

`product-rank.sql`
```sql
WITH tong_hop AS (
  SELECT category, product_name, SUM(net_sales) AS doanh_thu
  FROM sales
  GROUP BY category, product_name
),
xep_hang AS (
  SELECT
    category AS danh_muc,
    product_name AS san_pham,
    ROUND(doanh_thu, 2) AS doanh_thu,
    RANK() OVER (PARTITION BY category ORDER BY doanh_thu DESC) AS hang
  FROM tong_hop
)
SELECT danh_muc, san_pham, doanh_thu, hang
FROM xep_hang
WHERE hang <= 3
ORDER BY danh_muc, hang;
```

`top-customers.sql`
```sql
SELECT
  customer_id AS ma_khach,
  CONCAT(MIN(customer_name), ' (#', customer_id, ')') AS khach_hang,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS tong_chi,
  ROUND(SUM(net_sales) / COUNT(*), 2) AS trung_binh_moi_don
FROM sales
GROUP BY customer_id
ORDER BY tong_chi DESC
LIMIT 10;
```

`above-average.sql`
```sql
SELECT
  customer_id AS ma_khach,
  CONCAT(MIN(customer_name), ' (#', customer_id, ')') AS khach_hang,
  COUNT(*) AS so_don,
  ROUND(SUM(net_sales), 2) AS tong_chi
FROM sales
GROUP BY customer_id
HAVING SUM(net_sales) > (
  SELECT AVG(tong) FROM (SELECT SUM(net_sales) AS tong FROM sales GROUP BY customer_id) AS tam
)
ORDER BY tong_chi DESC;
```

`customer-referee.sql`
```sql
SELECT id, name, referee_id
FROM customer
WHERE referee_id IS NULL OR referee_id <> 2
ORDER BY id;
```

`low-fat-recyclable.sql`
```sql
SELECT product_id, low_fats, recyclable
FROM products
WHERE low_fats = 'Y' AND recyclable = 'Y'
ORDER BY product_id;
```

- [ ] **Step 4: Viết `backend/src/queries/index.js`**

```js
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const MANIFEST = [
  { id: 'overview', file: 'overview.sql', group: 'Doanh thu', title: 'Tổng quan kinh doanh', description: 'Tổng doanh thu thuần, số đơn, số khách và giá trị trung bình mỗi đơn.' },
  { id: 'monthly-revenue', file: 'monthly-revenue.sql', group: 'Doanh thu', title: 'Doanh thu theo tháng', description: 'Doanh thu, số đơn và số khách theo từng tháng bằng GROUP BY.' },
  { id: 'category-share', file: 'category-share.sql', group: 'Doanh thu', title: 'Tỷ trọng theo danh mục', description: 'Doanh thu và phần trăm đóng góp của từng danh mục bằng window function.' },
  { id: 'monthly-growth', file: 'monthly-growth.sql', group: 'Doanh thu', title: 'Tăng trưởng theo tháng', description: 'So sánh doanh thu mỗi tháng với tháng trước bằng LAG().' },
  { id: 'top-products', file: 'top-products.sql', group: 'Sản phẩm', title: 'Top 10 sản phẩm', description: 'Sản phẩm bán chạy theo doanh thu. Nhóm theo tên vì 40 mã chỉ có 21 tên.' },
  { id: 'product-rank', file: 'product-rank.sql', group: 'Sản phẩm', title: 'Xếp hạng trong danh mục', description: 'Top 3 sản phẩm mỗi danh mục bằng RANK() OVER (PARTITION BY).' },
  { id: 'top-customers', file: 'top-customers.sql', group: 'Khách hàng', title: 'Top khách hàng', description: 'Khách chi nhiều nhất, nhóm theo customer_id và hiện kèm mã khách.' },
  { id: 'above-average', file: 'above-average.sql', group: 'Khách hàng', title: 'Chi tiêu trên trung bình', description: 'Khách có tổng chi lớn hơn mức trung bình, dùng subquery và HAVING.' },
  { id: 'customer-referee', file: 'customer-referee.sql', group: 'Bài tập', title: 'Khách không bị giới thiệu', description: 'Bài 584: referee_id IS NULL OR referee_id <> 2.' },
  { id: 'low-fat-recyclable', file: 'low-fat-recyclable.sql', group: 'Bài tập', title: 'Ít béo và tái chế', description: 'Bài 1757: lọc sản phẩm low_fats = Y và recyclable = Y.' },
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
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `cd backend; npm test`
Expected: 4 test PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/queries backend/test/registry.test.js backend/package.json
git commit -m "feat(api): registry 10 truy van SQL viet tay"
```

---

### Task 2: Guard SQL và runner

**Files:**
- Create: `backend/src/services/sqlGuard.js`
- Create: `backend/src/services/queryRunner.js`
- Test: `backend/test/queryRunner.test.js`

**Interfaces:**
- Consumes: `getQuery` (Task 1), `pool` từ `../config/db.js`.
- Produces: `assertReadOnly(sql): void` (ném lỗi `code='SQL_NOT_ALLOWED'`); `runQuery(id): Promise<QueryResult|null>` với `QueryResult = {id,title,sql,columns,rows,rowCount,totalRows,truncated,durationMs,ranAt}`.

- [ ] **Step 1: Viết test thất bại**

```js
// backend/test/queryRunner.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertReadOnly } from '../src/services/sqlGuard.js'
import { runQuery } from '../src/services/queryRunner.js'

test('guard chặn câu lệnh ghi', () => {
  assert.throws(() => assertReadOnly('DELETE FROM sales'), { code: 'SQL_NOT_ALLOWED' })
  assert.throws(() => assertReadOnly('SELECT 1; DROP TABLE sales'), { code: 'SQL_NOT_ALLOWED' })
})

test('guard cho phép SELECT và WITH có dấu ; cuối', () => {
  assert.doesNotThrow(() => assertReadOnly('SELECT 1;'))
  assert.doesNotThrow(() => assertReadOnly('WITH t AS (SELECT 1) SELECT * FROM t'))
})

test('runQuery trả null với id lạ', async () => {
  assert.equal(await runQuery('khong-ton-tai'), null)
})

test('runQuery trả kết quả cho overview', async (t) => {
  try {
    const result = await runQuery('overview')
    assert.equal(result.id, 'overview')
    assert.equal(result.rows.length, 1)
    assert.equal(result.rows[0].so_khach, 24)
    assert.ok(result.durationMs >= 0)
    assert.equal(result.truncated, false)
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      t.skip('MySQL chưa sẵn sàng')
      return
    }
    throw error
  }
})

test('nhãn khách hàng kèm mã để phân biệt tên trùng', async (t) => {
  try {
    const result = await runQuery('top-customers')
    assert.equal(result.rows.length, 10)
    for (const row of result.rows) {
      assert.match(row.khach_hang, /\(#\d+\)$/)
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      t.skip('MySQL chưa sẵn sàng')
      return
    }
    throw error
  }
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd backend; npm test`
Expected: FAIL — không tìm thấy module `sqlGuard.js`.

- [ ] **Step 3: Viết `sqlGuard.js` và `queryRunner.js`**

```js
// backend/src/services/sqlGuard.js
export function assertReadOnly(sql) {
  const statement = String(sql).trim().replace(/;+\s*$/, '')
  const allowed = /^(select|with)\b/i.test(statement) && !statement.includes(';')
  if (!allowed) {
    const error = new Error('Chỉ cho phép một câu SELECT/WITH duy nhất')
    error.code = 'SQL_NOT_ALLOWED'
    throw error
  }
}
```

```js
// backend/src/services/queryRunner.js
import { performance } from 'node:perf_hooks'
import { pool } from '../config/db.js'
import { getQuery } from '../queries/index.js'
import { assertReadOnly } from './sqlGuard.js'

const MAX_ROWS = 500

export async function runQuery(id) {
  const query = getQuery(id)
  if (!query) return null

  assertReadOnly(query.sql)

  const startedAt = performance.now()
  const [rows, fields] = await pool.query(query.sql)
  const durationMs = Math.round(performance.now() - startedAt)

  const totalRows = rows.length
  const limitedRows = rows.slice(0, MAX_ROWS)

  return {
    id: query.id,
    title: query.title,
    sql: query.sql,
    columns: fields.map((field) => ({ name: field.name, type: field.type })),
    rows: limitedRows,
    rowCount: limitedRows.length,
    totalRows,
    truncated: totalRows > MAX_ROWS,
    durationMs,
    ranAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `cd backend; npm test`
Expected: 9 test PASS (4 của Task 1 + 5 mới).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services backend/test/queryRunner.test.js
git commit -m "feat(api): chay truy van registry voi guard chi SELECT"
```

---

### Task 3: API `/api/queries`

**Files:**
- Create: `backend/src/routes/queries.routes.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/test/queries.api.test.js`

**Interfaces:**
- Consumes: `listQueries` (Task 1), `runQuery` (Task 2).
- Produces: `queriesRouter` gắn tại `/api/queries`; `GET /api/queries` → `{ok:true, queries}`; `GET /api/queries/:id` → `{ok:true, ...QueryResult}` / 404 `{ok:false,error:'QUERY_NOT_FOUND'}` / 503 `{ok:false,error:'DB_UNAVAILABLE'}`.

- [ ] **Step 1: Viết test thất bại**

```js
// backend/test/queries.api.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

let server
let baseUrl

test.before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(() => server.close())

test('GET /api/queries trả danh sách, không có SQL', async () => {
  const response = await fetch(`${baseUrl}/api/queries`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.queries.length, 10)
  assert.ok(body.queries.every((q) => q.sql === undefined))
})

test('GET /api/queries/overview trả kết quả và SQL', async (t) => {
  const response = await fetch(`${baseUrl}/api/queries/overview`)
  const body = await response.json()
  if (response.status === 503) {
    t.skip('MySQL chưa sẵn sàng')
    return
  }
  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.match(body.sql, /^SELECT/i)
  assert.equal(body.rowCount, 1)
})

test('GET /api/queries/khong-ton-tai trả 404', async () => {
  const response = await fetch(`${baseUrl}/api/queries/khong-ton-tai`)
  const body = await response.json()
  assert.equal(response.status, 404)
  assert.equal(body.error, 'QUERY_NOT_FOUND')
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd backend; npm test`
Expected: FAIL — `/api/queries` trả 404.

- [ ] **Step 3: Viết route và gắn vào `/api`**

```js
// backend/src/routes/queries.routes.js
import { Router } from 'express'
import { listQueries } from '../queries/index.js'
import { runQuery } from '../services/queryRunner.js'

const router = Router()

const DB_ERRORS = new Set(['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'])

router.get('/', (req, res) => {
  res.json({ ok: true, queries: listQueries() })
})

router.get('/:id', async (req, res, next) => {
  try {
    const result = await runQuery(req.params.id)
    if (!result) {
      return res.status(404).json({
        ok: false,
        error: 'QUERY_NOT_FOUND',
        message: `Không có truy vấn "${req.params.id}"`,
      })
    }
    res.json({ ok: true, ...result })
  } catch (error) {
    if (DB_ERRORS.has(error.code)) {
      return res.status(503).json({
        ok: false,
        error: 'DB_UNAVAILABLE',
        message: 'Không kết nối được MySQL.',
        hint: 'Kiểm tra backend/.env và service MySQL84.',
      })
    }
    next(error)
  }
})

export default router
```

Trong `backend/src/routes/index.js`, thêm:

```js
import queriesRoutes from './queries.routes.js'
router.use('/queries', queriesRoutes)
```

và bổ sung `'GET /api/queries'`, `'GET /api/queries/:id'` vào mảng `endpoints`.

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `cd backend; npm test`
Expected: 12 test PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes backend/test/queries.api.test.js
git commit -m "feat(api): endpoint danh sach va chay truy van"
```

---

### Task 4: Test harness frontend và format số

**Files:**
- Modify: `frontend/package.json` (devDependencies + script `"test": "vitest run"`)
- Create: `frontend/vitest.config.js`
- Create: `frontend/src/lib/format.js`
- Test: `frontend/src/lib/format.test.js`

**Interfaces:**
- Produces: `formatCell(value, type): string`, `formatNumber(value): string`, `formatDateTime(iso): string`; hằng `NUMERIC_TYPES: Set<number>`.

- [ ] **Step 1: Cài dev-dependency test**

Run: `cd frontend; npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`

- [ ] **Step 2: Viết test thất bại**

```js
// frontend/src/lib/format.test.js
import { describe, expect, it } from 'vitest'
import { formatCell, formatDateTime, formatNumber } from './format.js'

describe('formatNumber', () => {
  it('định dạng theo vi-VN', () => {
    expect(formatNumber(1234)).toBe('1.234')
    expect(formatNumber(1859208.9)).toBe('1.859.208,9')
  })
})

describe('formatCell', () => {
  it('NULL thành gạch ngang', () => {
    expect(formatCell(null, 3)).toBe('—')
    expect(formatCell(undefined, 3)).toBe('—')
  })

  it('DECIMAL dạng chuỗi được format như số', () => {
    expect(formatCell('1859208.90', 246)).toBe('1.859.208,9')
  })

  it('chuỗi tháng giữ nguyên', () => {
    expect(formatCell('2025-01', 253)).toBe('2025-01')
  })

  it('số nguyên có dấu phân cách', () => {
    expect(formatCell(64, 3)).toBe('64')
    expect(formatCell(1234, 3)).toBe('1.234')
  })
})

describe('formatDateTime', () => {
  it('đổi ISO sang giờ địa phương dạng ngắn', () => {
    expect(formatDateTime('2026-11-11T08:30:00.000Z')).toMatch(/\d{1,2}:\d{2}/)
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận fail**

Run: `cd frontend; npm test`
Expected: FAIL — không tìm thấy `./format.js`.

- [ ] **Step 4: Viết `frontend/src/lib/format.js`**

```js
const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

export const NUMERIC_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 246])

export function formatNumber(value) {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(numeric)) return String(value)
  return numberFormatter.format(numeric)
}

export function formatCell(value, type) {
  if (value === null || value === undefined) return '—'
  if (NUMERIC_TYPES.has(type)) return formatNumber(value)
  return String(value)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date)
}
```

- [ ] **Step 5: Tạo `frontend/vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: [] },
})
```

- [ ] **Step 6: Chạy test, xác nhận pass**

Run: `cd frontend; npm test`
Expected: 6 test PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.js frontend/src/lib
git commit -m "feat(web): format so lieu va harness test"
```

---

### Task 5: API client và hook âm thanh

**Files:**
- Modify: `frontend/src/api/client.js`
- Create: `frontend/src/hooks/useSound.js`
- Test: `frontend/src/hooks/useSound.test.jsx`

**Interfaces:**
- Consumes: `/api/queries`, `/api/queries/:id`.
- Produces: `getQueries(signal)`, `runQuery(id, signal)`; `useSound(): {enabled, toggle, play(name)}` với `name ∈ {'select','run','success','error'}`.

- [ ] **Step 1: Viết test thất bại**

```jsx
// frontend/src/hooks/useSound.test.jsx
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSound } from './useSound.js'

class FakeAudioContext {
  constructor() {
    this.currentTime = 0
    this.destination = {}
  }
  createOscillator() {
    return { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, type: 'sine' }
  }
  createGain() {
    return { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }
  }
  resume() {
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
}

beforeEach(() => {
  localStorage.clear()
  window.AudioContext = FakeAudioContext
})

describe('useSound', () => {
  it('không ném lỗi khi phát âm thanh và bật mặc định', () => {
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(true)
    expect(() => act(() => result.current.play('success'))).not.toThrow()
  })

  it('tắt tiếng và ghi nhớ vào localStorage', () => {
    const { result } = renderHook(() => useSound())
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(false)
    expect(localStorage.getItem('mysql-lab:sound')).toBe('off')
  })

  it('đọc lại trạng thái đã tắt', () => {
    localStorage.setItem('mysql-lab:sound', 'off')
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(false)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd frontend; npm test`
Expected: FAIL — không tìm thấy `./useSound.js`.

- [ ] **Step 3: Viết `useSound.js`**

```js
import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'mysql-lab:sound'
const PATTERNS = {
  select: [{ freq: 660, duration: 0.04, type: 'square' }],
  run: [{ freq: 440, duration: 0.06, type: 'sine' }, { freq: 660, duration: 0.06, type: 'sine', delay: 0.07 }],
  success: [
    { freq: 660, duration: 0.06, type: 'sine' },
    { freq: 880, duration: 0.06, type: 'sine', delay: 0.07 },
    { freq: 990, duration: 0.08, type: 'sine', delay: 0.14 },
  ],
  error: [{ freq: 180, duration: 0.18, type: 'sawtooth' }],
}

function readPreference() {
  return localStorage.getItem(STORAGE_KEY) !== 'off'
}

export function useSound() {
  const [enabled, setEnabled] = useState(readPreference)
  const contextRef = useRef(null)

  useEffect(() => () => {
    contextRef.current?.close?.()
    contextRef.current = null
  }, [])

  const ensureContext = () => {
    if (!contextRef.current) {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext
      if (!AudioCtor) return null
      contextRef.current = new AudioCtor()
    }
    contextRef.current.resume?.()
    return contextRef.current
  }

  const play = useCallback((name) => {
    if (!enabled) return
    const pattern = PATTERNS[name]
    const context = ensureContext()
    if (!pattern || !context) return

    for (const note of pattern) {
      const start = context.currentTime + (note.delay ?? 0)
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = note.type
      oscillator.frequency.setValueAtTime(note.freq, start)
      gain.gain.setValueAtTime(0.04, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + note.duration)
    }
  }, [enabled])

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      return next
    })
  }, [])

  return { enabled, toggle, play }
}
```

- [ ] **Step 4: Thêm `getQueries`/`runQuery` vào `frontend/src/api/client.js`**

```js
export class ApiError extends Error {
  constructor(message, { status, hint } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.hint = hint
  }
}

async function request(path, signal) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Không gọi được API. Backend đã chạy chưa?')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.ok) {
    throw new ApiError(body?.message ?? 'Yêu cầu thất bại', { status: response.status, hint: body?.hint })
  }
  return body
}

export async function getQueries(signal) {
  const body = await request('/api/queries', signal)
  return body.queries
}

export async function runQuery(id, signal) {
  return request(`/api/queries/${encodeURIComponent(id)}`, signal)
}
```

- [ ] **Step 5: Chạy test và lint**

Run: `cd frontend; npm test; npm run lint`
Expected: test PASS, lint sạch.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/client.js frontend/src/hooks
git commit -m "feat(web): api client va am thanh web audio"
```

---

### Task 6: Giao diện dashboard

**Files:**
- Create: `frontend/src/components/Sidebar.jsx`, `ResultTable.jsx`, `SqlPanel.jsx`, `StatusBar.jsx`
- Modify: `frontend/src/App.jsx` (viết lại), `frontend/src/index.css` (viết lại), `frontend/index.html` (title)
- Delete: `frontend/src/components/Roadmap.jsx`, `frontend/src/components/StatusPanel.jsx`
- Test: `frontend/src/components/Sidebar.test.jsx`, `ResultTable.test.jsx`, `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: `getQueries`, `runQuery`, `useSound`, `formatCell`, `formatDateTime`.
- Produces: `Sidebar({queries, activeId, onSelect})`, `ResultTable({columns, rows})`, `SqlPanel({sql})`, `StatusBar({health, soundEnabled, onToggleSound})`.

- [ ] **Step 1: Viết test thất bại**

```jsx
// frontend/src/components/Sidebar.test.jsx
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
```

```jsx
// frontend/src/components/ResultTable.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ResultTable from './ResultTable.jsx'

describe('ResultTable', () => {
  it('hiện NULL là gạch ngang và format số', () => {
    render(
      <ResultTable
        columns={[{ name: 'ten', type: 253 }, { name: 'tien', type: 246 }]}
        rows={[{ ten: 'An', tien: '1859208.90' }, { ten: null, tien: null }]}
      />,
    )
    expect(screen.getByText('1.859.208,9')).toBeTruthy()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
```

```jsx
// frontend/src/App.test.jsx
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
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd frontend; npm test`
Expected: FAIL — không tìm thấy `Sidebar.jsx`.

- [ ] **Step 3: Viết 4 component**

Yêu cầu bắt buộc:
- `Sidebar`: `queries` đã nhóm theo `group` (giữ thứ tự xuất hiện); mỗi mục là `<button type="button" aria-current={activeId === id}>`; heading là `<h2>`; bấm gọi `onSelect(id)`.
- `ResultTable`: `<table>` với `<thead>` sticky; `columns.map` header dùng `name`; mỗi ô `formatCell(row[name], type)`; cột số (`NUMERIC_TYPES.has(type)`) thêm class `is-number`; `rows` rỗng hiện "Truy vấn không trả về dòng nào.".
- `SqlPanel`: `<details><summary>Câu SQL đã dùng</summary><pre>{sql}</pre></details>` + nút copy dùng `navigator.clipboard.writeText(sql)`, nhãn đổi "Đã copy" trong 1,5 giây.
- `StatusBar`: hiện `health.database.status === 'connected'` thành "MySQL đã kết nối", ngược lại "MySQL chưa kết nối"; nút âm thanh `aria-pressed={soundEnabled}` nhãn "Âm thanh".

- [ ] **Step 4: Viết lại `App.jsx`**

Hành vi:
- `useEffect` nạp `getQueries()` một lần; lỗi nạp hiện hộp lỗi toàn trang.
- Chọn mục → `setActiveId` + `play('select')` + chạy `runQuery(id, controller.signal)`; trước khi chạy `setStatus('loading')`, `play('run')` sau 70 ms; thành công `play('success')`; lỗi (không phải `AbortError`) `play('error')` và lưu `{message, hint}`.
- Huỷ request cũ bằng `AbortController` khi đổi mục.
- Nút "Chạy lại" gọi lại truy vấn đang chọn, không phát `select`.
- Loading: skeleton 5 dòng. Lỗi: hộp `.error-box` với message + hint + nút "Thử lại"; **không render bảng cũ**.
- Header gồm wordmark, `StatusBar`, nút âm thanh.
- `StatusBar` nhận `health` từ `getHealth()` (giữ hàm cũ trong client).

- [ ] **Step 5: Viết lại `index.css`**

Dùng đúng token màu ở Global Constraints. Bố cục: grid `260px 1fr`, header cao 56px, sidebar cuộn riêng, bảng sticky header, hàng chẵn `#16222F`, `@media (max-width: 900px)` chuyển sidebar thành hàng ngang cuộn, bảng cuộn ngang. Focus outline `#F29111`. `@media (prefers-reduced-motion: reduce)` tắt transition.

- [ ] **Step 6: Chạy test, build, lint**

Run: `cd frontend; npm test; npm run build; npm run lint`
Expected: test PASS, build thành công, lint sạch.

- [ ] **Step 7: Commit**

```bash
git add frontend/src frontend/index.html
git commit -m "feat(web): bang truy van co am thanh va trang thai"
```

---

### Task 7: Kiểm chứng đầu-cuối và tài liệu

**Files:**
- Modify: `README.md` (bỏ mô tả landing, thêm mục "Bảng truy vấn", cách thêm truy vấn mới)

- [ ] **Step 1: Chạy backend và kiểm tra API**

Run: `cd backend; npm start` (terminal riêng), rồi:
```powershell
curl http://localhost:4000/api/queries
curl http://localhost:4000/api/queries/monthly-revenue
```
Expected: 10 mục; doanh thu 2025-01 = `1859208.90`.

- [ ] **Step 2: Đối chiếu số liệu bằng mysql CLI**

Run:
```powershell
$env:MYSQL_PWD='Lab@HocMySQL2026'
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u lab_app -h 127.0.0.1 -D hocmysql -e "SELECT id, referee_id FROM customer WHERE referee_id IS NULL OR referee_id <> 2;"
```
Expected: id 1, 2, 4, 5.

- [ ] **Step 3: Kiểm tra lỗi DB**

Dừng MySQL (`Stop-Service MySQL84` cần Admin) hoặc tạm đổi `DB_PASSWORD` sai trong `.env` rồi khởi động lại backend; gọi `/api/queries/overview` → 503 `DB_UNAVAILABLE`; UI hiện hộp lỗi và không có bảng. Khôi phục `.env`.

- [ ] **Step 4: Chạy giao diện và kiểm tra bằng tay**

Run: `cd frontend; npm run dev`
Kiểm tra: chọn từng mục chạy đúng; số NULL hiện `—`; nút âm thanh tắt/bật và nhớ sau khi tải lại; thu nhỏ < 900px sidebar thành hàng ngang; Tab + Enter chọn được mục.

- [ ] **Step 5: Cập nhật README**

Thêm mục "Bảng truy vấn" liệt kê 4 nhóm, cách thêm truy vấn mới (tạo `.sql` + một dòng trong `queries/index.js`), và lệnh chạy. Bỏ mô tả trang landing.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: huong dan bang truy van va them truy van moi"
```

---

## Self-Review

- **Spec coverage:** 10 truy vấn (Task 1), guard + giới hạn 500 dòng + `truncated` (Task 2), 2 endpoint + mã lỗi (Task 3), format số/NULL/ngày (Task 4), âm thanh + lưu tắt/bật (Task 5), sidebar/bảng/SQL/status, thay trang cũ, responsive (Task 6), kiểm chứng + README (Task 7).
- **Type consistency:** `QueryResult` dùng đúng ở Task 2, 3, 5, 6; `formatCell(value, type)` khớp `columns[].type`; tên âm thanh khớp bảng `PATTERNS`.
- **Review Focus:** mỗi dòng có test tương ứng ở Task 3, 4, 5, 6, 7.
