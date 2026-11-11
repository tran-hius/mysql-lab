# MySQL Lab — Bảng truy vấn (Query Dashboard)

Ngày: 2026-11-11
Trạng thái: chờ duyệt

## 1. Bối cảnh và lý do

Người dùng đang luyện SQL. Họ viết và thử câu lệnh ở MySQL Workbench, nhưng muốn thấy câu SQL
viết tay trong **backend** chạy trong một ứng dụng thật và kết quả được trình bày dễ đọc.

Vì vậy sản phẩm này **không** phải SQL playground. Không có ô nhập SQL trên web. Mỗi truy vấn là
một file `.sql` nằm trong backend; giao diện chỉ chọn truy vấn, gọi API, và hiển thị kết quả.

## 2. Mục tiêu

- Mỗi truy vấn = một file `.sql` trong backend + một mục trong registry + một endpoint chạy nó.
- Giao diện xếp truy vấn theo nhóm, hiển thị: mô tả, câu SQL đã dùng (chỉ đọc), bảng kết quả,
  số dòng, thời gian chạy, thời điểm chạy.
- Thêm truy vấn mới chỉ cần thêm file backend và một dòng registry; sidebar tự có mục mới.
- Mỗi thao tác có âm thanh phản hồi, tắt được, nhớ trạng thái.
- Chạy đúng trên dữ liệu `hocmysql` hiện có.

## 3. Không nằm trong phạm vi (non-goals)

- Không có editor SQL, không nhận SQL tuỳ ý từ client.
- Không có đăng nhập, phân quyền, nhiều người dùng.
- Chưa hỗ trợ ghi dữ liệu từ UI (toàn bộ truy vấn là `SELECT`/`WITH`).
- Không có biểu đồ, không phân trang, không đa ngôn ngữ.
- Không dùng ORM; SQL viết tay.

## 4. Anti-goals

- Giao diện hiển thị dữ liệu giả hoặc số liệu bịa khi DB lỗi.
- Kéo thêm thư viện UI/chart lớn cho một dashboard nhỏ.
- Âm thanh tự phát khi mở trang, hoặc không có cách tắt.
- Truy vấn phải sửa frontend mỗi lần thay đổi.

## 5. Ràng buộc

- MySQL 8.4 local, database `hocmysql`, user `lab_app` (quyền SELECT/INSERT/UPDATE/DELETE trên
  `hocmysql`). Thông tin kết nối nằm trong `backend/.env`, không commit.
- Backend: Node 24, Express 5, `mysql2` (pool đã có ở `src/config/db.js`).
- Frontend: React 19, Vite 8, proxy `/api` → `http://localhost:4000`.
- Dữ liệu thực tế:
  - `sales`: 422 dòng, 24 khách, 40 `product_id` nhưng chỉ 21 tên sản phẩm, 4 danh mục,
    2025-01-01 → 2025-08-28. Bảng phi chuẩn hoá, đã chứa tên khách/tên sản phẩm.
  - `customer`: 6 dòng (`id`, `name`, `referee_id`).
  - `products`: 5 dòng (`product_id`, `low_fats`, `recyclable`).
  - `customer` và `products` không nối được với `sales` (id khác hệ), nên chỉ dùng cho bài tập riêng.
- Khoá khách hàng là `customer_id` (24 giá trị), nhưng dữ liệu có **28 tên khách khác nhau**:
  19/24 mã khách mang hai tên, và 15 tên xuất hiện dưới hai mã. Vì vậy mọi truy vấn nhóm khách phải
  `GROUP BY customer_id`; nhãn hiển thị lấy `MIN(customer_name)` kèm mã khách, ví dụ
  `Nguyen Van An (#501)`, để hai dòng trùng tên vẫn phân biệt được. Không nhóm theo tên.
- 40 mã sản phẩm chỉ có 21 tên. Một ngoại lệ: mã 114 có thêm tên gõ sai `Manh Dell UltraSharp`
  (mã 13 dùng `Man hinh Dell UltraSharp`). Truy vấn nhóm theo `product_name` đúng như dữ liệu,
  chấp nhận tên gõ sai là một sản phẩm riêng; không tự sửa dữ liệu.
- Cả 24 khách đều mua từ 2 lần trở lên, nên không làm truy vấn "khách mua một lần" (kết quả rỗng).

## 6. Phương án bố cục và lựa chọn

- **A. Tab ngang**: mỗi truy vấn một tab. Gọn nhưng 10 truy vấn sẽ tràn trên laptop.
- **B. Sidebar + vùng kết quả** (đã chọn): danh sách nhóm bên trái, chi tiết bên phải. Mở rộng
  tốt, nhìn được toàn bộ danh mục, phù hợp khi số truy vấn tăng.
- **C. Một trang cuộn**: đổ tất cả kết quả. Nặng và khó đọc khi dữ liệu nhiều.

Chọn **B** vì danh sách truy vấn sẽ tăng dần theo quá trình luyện, và mỗi màn chỉ nên tải một
kết quả.

## 7. Thiết kế

### 7.1 Backend

Cấu trúc:

```
backend/src/queries/
├─ index.js              # registry: id, title, group, description, file
├─ overview.sql
├─ monthly-revenue.sql
├─ category-share.sql
├─ monthly-growth.sql
├─ top-products.sql
├─ product-rank.sql
├─ top-customers.sql
├─ above-average.sql
├─ customer-referee.sql
└─ low-fat-recyclable.sql
```

`index.js` đọc các file `.sql` một lần khi khởi động và giữ nội dung trong bộ nhớ. Mỗi mục:

```js
{
  id: 'monthly-revenue',
  title: 'Doanh thu theo tháng',
  group: 'Doanh thu',
  description: 'Tổng doanh thu thuần, số đơn và số khách theo từng tháng.',
  sql: '...'
}
```

API (mount tại `/api`):

| Method | Đường dẫn | Kết quả |
|---|---|---|
| GET | `/api/queries` | Danh sách metadata, không kèm SQL và dữ liệu |
| GET | `/api/queries/:id` | Chạy truy vấn, trả kết quả |
| GET | `/api/health` | Giữ nguyên, dùng cho thanh trạng thái |

Response của `/api/queries/:id`:

```json
{
  "ok": true,
  "id": "monthly-revenue",
  "title": "Doanh thu theo tháng",
  "sql": "SELECT ...",
  "columns": [{ "name": "thang", "type": "VAR_STRING" }],
  "rows": [{ "thang": "2025-01", "so_don": 64 }],
  "rowCount": 8,
  "totalRows": 8,
  "truncated": false,
  "durationMs": 12,
  "ranAt": "2026-11-11T08:30:00.000Z"
}
```

`rowCount` = số dòng trả về sau khi cắt; `totalRows` = số dòng truy vấn thực sự sinh ra;
`truncated` = `true` khi `totalRows > rowCount`.

Quy tắc an toàn:

- Chỉ chạy truy vấn có trong registry, không nhận SQL từ request.
- Kiểm tra nội dung bắt đầu bằng `SELECT` hoặc `WITH` và không chứa `;` (một câu duy nhất).
- Kết quả giới hạn 500 dòng; nếu vượt, cắt và trả `truncated: true` để UI báo.
- Lỗi DB trả `503` với `error: 'DB_UNAVAILABLE'`; lỗi SQL trả `500` kèm `message` (che stack ở
  production).
- `durationMs` đo bằng `performance.now()` quanh lúc query.

### 7.2 Danh sách truy vấn

Nhóm **Doanh thu**

1. `overview` — Tổng quan kinh doanh: tổng doanh thu thuần, số đơn, số khách
   (`COUNT(DISTINCT customer_id)`), giá trị trung bình mỗi đơn. (aggregate)
2. `monthly-revenue` — Doanh thu theo tháng: doanh thu, số đơn, số khách
   (`COUNT(DISTINCT customer_id)`). (`GROUP BY`, hàm ngày)
3. `category-share` — Doanh thu và tỷ trọng % theo danh mục.
   (`SUM() OVER ()` tính tổng toàn cục)
4. `monthly-growth` — Tăng trưởng so với tháng trước: doanh thu, tháng trước, chênh lệch %.
   (`LAG()`)

Nhóm **Sản phẩm**

5. `top-products` — Top 10 sản phẩm theo doanh thu: số lượng bán, số đơn, doanh thu, giá trị
   trung bình mỗi đơn. (`GROUP BY product_name`, `ORDER BY`, `LIMIT`)
6. `product-rank` — Xếp hạng sản phẩm trong từng danh mục **theo doanh thu**, lấy top 3 mỗi
   danh mục. (`RANK() OVER (PARTITION BY category ORDER BY SUM(net_sales) DESC)`, CTE)

Nhóm **Khách hàng**

7. `top-customers` — Top khách hàng theo doanh thu: mã khách, tên đại diện, số đơn, tổng chi,
   giá trị trung bình mỗi đơn. Nhóm theo `customer_id`, nhãn `MIN(customer_name) (#id)`.
8. `above-average` — Khách chi tiêu trên mức trung bình toàn hệ thống, nhóm theo `customer_id`.
   (subquery so với `AVG(SUM(...))`, `HAVING`)

Nhóm **Bài tập bảng phụ**

9. `customer-referee` — Khách không được giới thiệu bởi khách id = 2 (bài 584 trên bảng `customer`):
   điều kiện `referee_id IS NULL OR referee_id <> 2`, kết quả mong đợi là id 1, 2, 4, 5.
10. `low-fat-recyclable` — Sản phẩm vừa ít béo vừa tái chế được (bài 1757 trên bảng `products`):
    `low_fats = 'Y' AND recyclable = 'Y'`.

Mỗi truy vấn có `description` ngắn nêu kiến thức nó luyện (GROUP BY, window function, subquery…).

### 7.3 Frontend

Bố cục:

```
┌──────────────────────────────────────────────────────────────┐
│ MySQLLab   Trạng thái: MySQL đã kết nối      [âm thanh: bật] │
├──────────────┬───────────────────────────────────────────────┤
│ Doanh thu    │  Doanh thu theo tháng                         │
│  Tổng quan   │  Tổng doanh thu thuần, số đơn...              │
│  Theo tháng  │  ┌──────────────────────────────────────────┐ │
│  Danh mục    │  │ 8 dòng · 12 ms · 21:04   [Chạy lại]      │ │
│  Tăng trưởng │  ├──────────────────────────────────────────┤ │
│ Sản phẩm     │  │ tháng    | số đơn | doanh thu            │ │
│  Top 10      │  │ 2025-01  | 64     | 1.859.209            │ │
│  Xếp hạng    │  └──────────────────────────────────────────┘ │
│ Khách hàng   │  ▸ Câu SQL đã dùng                    [copy]  │
│ Bài tập      │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

Thành phần:

Trang này **thay thế hoàn toàn** trang landing hiện tại (lede, `Roadmap.jsx`, `StatusPanel.jsx` cũ
bị xoá). Chức năng kiểm tra kết nối của trang cũ chuyển vào `StatusBar`.

- `App.jsx`: nạp danh sách truy vấn, chọn mục, gọi kết quả, giữ trạng thái loading/error.
- `components/Sidebar.jsx`: nhóm theo `group`, nút cho từng truy vấn, mục đang chọn có vạch nhấn.
- `components/ResultTable.jsx`: bảng sticky header, căn phải cho cột số, format số theo `vi-VN`,
  hiện `—` cho `NULL`.
- `components/SqlPanel.jsx`: `<details>` chứa SQL (font mono), nút copy.
- `components/StatusBar.jsx`: trạng thái API/MySQL và nút bật/tắt âm thanh.
- `hooks/useSound.js`: Web Audio API, không dùng file âm thanh.
- `api/client.js`: `getQueries()`, `runQuery(id)`.

Trạng thái:

- Chọn một mục ở sidebar là **chạy ngay** (auto-run), có thể huỷ request cũ bằng `AbortController`
  khi đổi mục nhanh. Nút "Chạy lại" chạy lại truy vấn đang chọn.
- Chưa chọn: màn hình mời chọn truy vấn bên phải.
- Loading: skeleton 5 dòng, nút chạy lại disabled.
- Lỗi: hộp lỗi nêu lỗi thật + gợi ý kiểm tra MySQL, có nút thử lại. Không hiện bảng cũ.
- Kết quả rỗng: một dòng thông báo "Truy vấn không trả về dòng nào."

Thẩm mỹ:

- Nền `#0E1620`, panel `#131E2B`, viền `#223044`, chữ `#E6EDF3`, chữ phụ `#8B9BAE`,
  nhấn cam `#F29111`, thành công `#3FB950`, lỗi `#F85149`.
- Font: Instrument Sans (nhãn, tiêu đề), IBM Plex Mono (SQL, số, metadata). Đã nạp trong
  `index.html`.
- Không gradient, không đổ bóng lớn; phân cấp bằng đường kẻ và khoảng trắng.
- Bảng không kẻ dọc; header dính; hàng chẵn nền `#16222F`.
- Focus rõ ràng, điều hướng bằng bàn phím được, tôn trọng `prefers-reduced-motion`.

Âm thanh (Web Audio, tổng hợp bằng oscillator, gain thấp khoảng 0.04):

| Thao tác | Âm |
|---|---|
| Bấm chọn truy vấn / nút | blip vuông 660 Hz, 40 ms |
| Bắt đầu chạy | hai nốt 440 → 660 Hz |
| Có kết quả | ba nốt ngắn 660/880/990 Hz |
| Lỗi | sóng răng cưa 180 Hz, 180 ms |

- Nút bật/tắt ở thanh trên, lưu `localStorage` khoá `mysql-lab:sound`.
- Mặc định bật nhưng `AudioContext` chỉ tạo sau thao tác đầu tiên của người dùng.
- Khi chọn mục: phát "bấm chọn", rồi "bắt đầu chạy" sau khoảng 70 ms, rồi "có kết quả" khi
  response về. Nút "Chạy lại" chỉ phát hai âm sau. Âm lượng thấp để ba âm liên tiếp không chói.

### 7.4 Cấu trúc file sau khi làm

```
backend/src/
├─ queries/                 # registry + 10 file .sql
├─ routes/queries.routes.js
└─ (giữ nguyên config, middleware, health)

frontend/src/
├─ api/client.js
├─ hooks/useSound.js
├─ components/{Sidebar,ResultTable,SqlPanel,StatusBar}.jsx
├─ App.jsx
└─ index.css
```

## 8. Kiểm chứng

- `GET /api/queries` trả đủ 10 mục, không lộ SQL.
- Chạy từng endpoint và đối chiếu số liệu với `mysql` CLI (ví dụ doanh thu tháng 2025-01 =
  1.859.208,90; `customer-referee` trả id 1, 2, 4, 5).
- `overview` báo 24 khách; `top-customers` trả 24 dòng, nhãn dạng `Tên (#id)`.
- Tắt MySQL → UI hiện lỗi rõ ràng, không hiện bảng cũ; bật lại → chạy được.
- `npm run build` và `npm run lint` sạch ở frontend.
- Thử bàn phím: Tab chọn được mục, Enter chạy; nút âm thanh có `aria-pressed`.
- Thu nhỏ cửa sổ dưới 900px: sidebar chuyển thành danh sách chọn ngang/drawer, bảng cuộn ngang.

## 9. Việc còn để người xây dựng quyết

- Chi tiết CSS, skeleton, cách hiển thị metadata trên mobile.
- Có thêm nhóm "Tổng quan" dạng KPI card hay dùng bảng như các truy vấn khác.
- Cách cắt chuỗi tên dài trong sidebar và tiêu đề cột.
