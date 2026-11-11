# MySQL Lab

Ứng dụng web để **thực hành MySQL**: bạn viết câu SQL trong backend, giao diện chạy và hiển thị kết quả thật từ MySQL 8.4.
Không dùng ORM — SQL viết tay để học được câu lệnh.

## Stack

| Lớp | Công nghệ | Thư mục |
|---|---|---|
| Database | MySQL 8.4 (dịch vụ `MySQL84`) | `database/` |
| Backend | Node.js 24, Express 5, `mysql2` | `backend/` |
| Frontend | React 19, Vite 8 | `frontend/` |
| Công cụ | Git, npm, nodemon | — |

## Cách chạy

Cần MySQL đang chạy. Mở hai terminal:

```powershell
# Terminal 1 — API (http://localhost:4000)
cd backend
Copy-Item .env.example .env   # lần đầu, sau đó điền mật khẩu MySQL
npm install
npm run dev
```

```powershell
# Terminal 2 — giao diện (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Vite proxy `/api` sang cổng 4000, nên giao diện gọi `fetch('/api/health')` là đủ.

Kiểm tra API trực tiếp:

```powershell
curl http://localhost:4000/api/health
```

Kết quả mong đợi khi MySQL đã cấu hình đúng: `ok: true`, `database.status: "connected"`.

## Bảng truy vấn

Giao diện là một bảng truy vấn: chọn mục ở cột trái, backend chạy câu SQL tương ứng trên MySQL và trả kết quả về bảng bên phải. Bạn viết và sửa SQL trong backend (hoặc MySQL Workbench), giao diện chỉ hiển thị.

10 truy vấn chia 4 nhóm:

| Nhóm | Truy vấn | Kỹ thuật |
|---|---|---|
| Doanh thu | Tổng quan, doanh thu theo tháng, tỷ trọng danh mục, tăng trưởng tháng | `GROUP BY`, window function, `LAG()` |
| Sản phẩm | Top 10 sản phẩm, xếp hạng trong danh mục | `ORDER BY`, `RANK() OVER (PARTITION BY)` |
| Khách hàng | Top khách hàng, chi tiêu trên trung bình | nhóm theo `customer_id`, subquery + `HAVING` |
| Bài tập | Khách không bị giới thiệu, ít béo và tái chế | điều kiện `NULL`, lọc chuỗi |

### Thêm truy vấn mới

1. Tạo file `backend/src/queries/<ten>.sql` chứa **một câu** `SELECT` hoặc `WITH`.
2. Thêm một dòng vào mảng `MANIFEST` trong `backend/src/queries/index.js` với `id`, `file`, `group`, `title`, `description`.
3. Chạy `cd backend; npm test` để kiểm tra registry, rồi tải lại giao diện.

API chỉ chạy truy vấn có trong registry — không nhận SQL từ trình duyệt — và trả tối đa 500 dòng (`truncated: true` nếu nhiều hơn).

## Cấu trúc

```
mysql-lab/
├─ .opencode/            # skill và plugin cho agent (chỉ áp dụng trong dự án này)
│  ├─ opencode.json
│  └─ skills/
├─ backend/
│  ├─ src/
│  │  ├─ config/         # env.js, db.js (pool + transaction)
│  │  ├─ middleware/     # notFound, errorHandler
│  │  ├─ queries/        # 10 file .sql + registry index.js
│  │  ├─ routes/         # health, queries
│  │  ├─ services/       # sqlGuard.js, queryRunner.js
│  │  ├─ app.js
│  │  └─ server.js
│  └─ .env.example
├─ frontend/
│  └─ src/
│     ├─ api/client.js
│     ├─ components/     # Sidebar, ResultTable, SqlPanel, StatusBar
│     ├─ hooks/          # useSound
│     ├─ lib/            # format số, NULL, thời gian
│     ├─ App.jsx
│     └─ index.css
└─ README.md
```

## API hiện có

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api` | Thông tin API |
| GET | `/api/health` | Trạng thái API + kết nối MySQL (503 nếu DB lỗi) |
| GET | `/api/queries` | Danh sách 10 truy vấn (không kèm SQL) |
| GET | `/api/queries/:id` | Chạy truy vấn, trả `columns`, `rows`, `sql`, `durationMs` (404 id lạ, 503 khi DB lỗi) |

## Ghi chú kỹ thuật

- `backend/src/config/db.js` dùng connection pool, placeholder `?` khi truyền tham số, có sẵn `withTransaction()` cho các bước sau.
- `dotenv` đọc `backend/.env`; file này không commit.
- `backend/src/services/sqlGuard.js` chỉ cho phép một câu `SELECT`/`WITH`; `queryRunner.js` chặn kết quả trên 500 dòng.
- Giao diện hiển thị `NULL` thành `—`, `DECIMAL` (mysql2 trả chuỗi) được format theo kiểu số.
- Âm thanh dùng Web Audio, bật/tắt được và lưu trong `localStorage` khoá `mysql-lab:sound`.
- Test: `cd backend; npm test` (node --test) và `cd frontend; npm test` (Vitest).

