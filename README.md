# MySQL Lab

Ứng dụng web để **thực hành MySQL**: giao diện React, API Node.js và database MySQL 8.4 chạy cùng nhau.
Mỗi bước của dự án thêm một phần thật vào hệ thống — không dùng ORM, SQL viết tay để học được câu lệnh.

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

## Lộ trình

- [x] **1. Khởi tạo dự án** — Git, README, remote GitHub.
- [x] **2. Khung backend và frontend** — Express API, React + Vite, trang trạng thái hệ thống.
- [ ] **3. Thiết kế schema** — chọn đề tài, xác định bảng, khóa ngoại, quan hệ.
- [ ] **4. Tạo database** — `schema.sql`, dữ liệu mẫu, tài khoản MySQL riêng cho app.
- [ ] **5. API CRUD** — đọc và ghi bảng đầu tiên bằng `mysql2`.
- [ ] **6. Giao diện CRUD** — bảng dữ liệu, form thêm/sửa, thông báo lỗi.
- [ ] **7. Truy vấn nâng cao** — JOIN, tìm kiếm, phân trang, thống kê, transaction.
- [ ] **8. Đóng gói** — script chạy một lệnh, tài liệu sử dụng.

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
│  │  ├─ routes/         # health check
│  │  ├─ app.js
│  │  └─ server.js
│  └─ .env.example
├─ frontend/
│  └─ src/
│     ├─ api/client.js
│     ├─ components/     # StatusPanel, Roadmap
│     ├─ App.jsx
│     └─ index.css
└─ README.md
```

## API hiện có

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api` | Thông tin API |
| GET | `/api/health` | Trạng thái API + kết nối MySQL (503 nếu DB lỗi) |

## Ghi chú kỹ thuật

- `backend/src/config/db.js` dùng connection pool, placeholder `?` khi truyền tham số, có sẵn `withTransaction()` cho các bước sau.
- `dotenv` đọc `backend/.env`; file này không commit.
- Trang chủ gọi `/api/health` và hiển thị trạng thái thật của API và MySQL, không dùng dữ liệu giả.
