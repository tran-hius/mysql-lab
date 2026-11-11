# MySQL Lab

Dự án thực hành MySQL: một ứng dụng web **có đầy đủ giao diện (frontend) + backend + cơ sở dữ liệu MySQL**,
xây dựng theo từng bước để vừa học MySQL vừa có một sản phẩm chạy được.

## Mục tiêu

- Viết schema quan hệ thật: khóa chính, khóa ngoại, index, ràng buộc, transaction.
- Thực hành các câu lệnh SQL hay dùng: CRUD, JOIN, GROUP BY, subquery, view, procedure, trigger.
- Có backend thật gọi MySQL (không dùng ORM để che giấu SQL).
- Có giao diện để thao tác dữ liệu thay vì gõ SQL thuần.

## Stack dự kiến

| Lớp | Công nghệ |
|---|---|
| Database | MySQL 8.4 (đang chạy sẵn trên máy) |
| Backend | Node.js + Express + `mysql2` (viết SQL tay, connection pool) |
| Frontend | HTML + CSS + JavaScript thuần (không cần build) |
| Công cụ | Git, npm, `nodemon` khi dev |

## Lộ trình (làm theo từng bước)

- [x] **Bước 1** — Tạo và đặt tên dự án, khởi tạo Git.
- [ ] Bước 2 — Thiết kế nghiệp vụ + schema database.
- [ ] Bước 3 — Tạo database, bảng, dữ liệu mẫu.
- [ ] Bước 4 — Khung backend Express + kết nối MySQL.
- [ ] Bước 5 — API CRUD.
- [ ] Bước 6 — Giao diện frontend.
- [ ] Bước 7 — Nâng cao: JOIN/thống kê, đăng nhập, phân trang, transaction.
- [ ] Bước 8 — Đóng gói, chạy thử, tài liệu.

## Cấu trúc dự kiến

```
mysql-lab/
├─ backend/
│  ├─ src/
│  │  ├─ config/        # kết nối MySQL
│  │  ├─ routes/        # định nghĩa API
│  │  ├─ controllers/   # xử lý request
│  │  ├─ queries/       # câu lệnh SQL
│  │  └─ app.js
│  └─ package.json
├─ frontend/
│  ├─ index.html
│  ├─ css/
│  └─ js/
├─ database/
│  ├─ schema.sql
│  └─ seed.sql
└─ README.md
```

## Trạng thái

Bước 1 hoàn thành — dự án đã được khởi tạo, chưa có code.
