# MySQL Lab

Ứng dụng web để **học và luyện SQL thực chiến** trên MySQL 8.4: dashboard 10 truy vấn, khóa học 44 bài có chấm điểm, thi cuối khóa, chứng chỉ và sandbox SQL chỉ đọc.

Không dùng ORM — mọi câu SQL đều viết tay để học được câu lệnh.

## Ba chế độ

| Chế độ | Nội dung |
|---|---|
| **Bảng truy vấn** | Dashboard 10 truy vấn mẫu trên database `hocmysql`, chạy và hiển thị kết quả thật |
| **Khóa học** | 9 module / 44 bài / 53 bài tập chấm tự động, ghi chú từng bài, tổng quan tiến độ, thi cuối khóa 12 câu, chứng chỉ SVG |
| **Sandbox** | Console SQL chỉ đọc trên database `shop`, kèm schema explorer 9 bảng |

Ảnh hưởng dữ liệu: dashboard chỉ đọc `hocmysql`; khóa học và sandbox dùng user MySQL riêng `lab_reader` chỉ có `SELECT ON shop.*`.

## Stack

| Lớp | Công nghệ | Thư mục |
|---|---|---|
| Database | MySQL 8.4 (dịch vụ `MySQL84`) | `database/` |
| Backend | Node.js 24, Express 5, `mysql2` | `backend/` |
| Frontend | React 19, Vite 8 | `frontend/` |
| Công cụ | Git, npm, nodemon | — |

## Cài đặt

### 1. Database

Cần MySQL đang chạy. Tạo database luyện tập `shop` (script tự `DROP TABLE` + seed cố định) và user chỉ đọc:

```powershell
# Database luyện tập: 9 bảng, 12 khách, 25 đơn, 49 order_items...
Get-Content database\shop.sql -Raw | mysql -u root -p

# User đọc: thay __PASSWORD__ bằng DB_READER_PASSWORD trong backend/.env
(Get-Content database\reader-user.sql -Raw) -replace '__PASSWORD__', 'Read@HocMySQL2026' | mysql -u root -p
```

Database `hocmysql` của dashboard là dữ liệu sẵn có trước đó (bảng `sales`). Khóa học không đụng tới database này.

### 2. Backend

```powershell
cd backend
Copy-Item .env.example .env   # lần đầu, sau đó điền mật khẩu MySQL
npm install
npm run dev                   # http://localhost:4000
```

Biến môi trường chính:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=lab_app
DB_PASSWORD=...
DB_NAME=hocmysql
DB_READER_USER=lab_reader
DB_READER_PASSWORD=...
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite proxy `/api` sang cổng 4000.

Kiểm tra API: `curl http://localhost:4000/api/health` — mong đợi `ok: true`, `database.status: "connected"`.

## Khóa học

### Lộ trình 9 module / 44 bài

| Module | Tên | Trọng tâm |
|---|---|---|
| 1 | Nền tảng thực chiến | `SELECT`, `WHERE`, `NULL`, `ORDER BY`, kiểu dữ liệu, ngày giờ |
| 2 | Tổng hợp và nhóm | `GROUP BY`, `HAVING`, aggregate, doanh thu, tỷ trọng |
| 3 | JOIN và quan hệ | inner/left/right, self join, anti join, nhiều bảng |
| 4 | Subquery và CTE | scalar, `IN`/`EXISTS`, correlated, `WITH`, đệ quy |
| 5 | Window functions | `ROW_NUMBER`, `RANK`, `LAG/LEAD`, running total, frame |
| 6 | Analytics sản phẩm | funnel, retention, cohort, session, KPI sản phẩm |
| 7 | Hiệu năng và tối ưu | `EXPLAIN`, index, `LIKE`/`sargable`, tránh full scan |
| 8 | Mô hình và vận hành | chuẩn hóa, SCD, transaction, isolation, idempotency |
| 9 | DE/ML thực chiến | feature engineering, label, dedup, pipeline, data quality |

Mỗi bài có ba khu vực tách biệt:

- **Học** — nội dung lý thuyết dạng khối có cấu trúc (đoạn văn, code, bảng, callout, các bước) và panel **Ghi chú của bạn** tự lưu sau 600 ms vào `localStorage`.
- **Làm bài** — editor SQL (Ctrl+Enter) hoặc quiz 4 lựa chọn, gợi ý mở dần, xem đáp án sau khi làm.
- **Kết quả** — trạng thái pass/fail, số lần thử, lịch sử, XP, nút bài tiếp.

### Chấm điểm

- Kết quả SQL được so theo multiset: alias tự do, thứ tự cột phải khớp, `NULL = NULL`, số lệch tối đa `0.01`; chỉ so thứ tự dòng khi bài yêu cầu `ORDER BY`.
- Mọi đáp án mẫu đều được chạy thật trên `shop` trong bộ test backend.
- Tiến độ, ghi chú và chứng chỉ chỉ lưu trong `localStorage` của trình duyệt:
  - `mysql-lab:course` — tiến độ bài tập và điểm thi
  - `mysql-lab:notes:<lessonId>` — ghi chú từng bài
  - `mysql-lab:certificate` — chứng chỉ đã cấp

### Thi cuối khóa và chứng chỉ

- Đề thi 12 câu: 8 SQL + 4 quiz, phủ cả 9 module; đạt khi **≥ 80/100**.
- Chứng chỉ mở khi **9/9 module pass** và điểm thi cao nhất ≥ 80.
- Chứng chỉ SVG A4 ngang (navy `#0E1620`, vàng `#D4A24A`), mã `SQLLAB-2026-XXXXXX`; tải SVG hoặc in/lưu PDF.
- Đây là chứng chỉ **cục bộ do ứng dụng cấp**, không được công nhận bên ngoài.

## Sandbox

- Trái: schema explorer 9 bảng — cột, kiểu, nullable, khóa, tổng số dòng, 3 dòng mẫu.
- Phải: editor + nút **Chạy** (Ctrl+Enter), bảng kết quả, thông báo cắt dòng, lỗi SQL hiển thị nguyên message.
- Chỉ cho `SELECT` / `WITH` / `EXPLAIN`; chặn DDL/DML, nhiều câu lệnh, `INTO OUTFILE`, `SLEEP()`, `BENCHMARK()`...
- Giới hạn 200 dòng, timeout 3 giây, user MySQL `lab_reader` chỉ có quyền `SELECT`.

## Bảng truy vấn

Chọn mục ở cột trái, backend chạy câu SQL tương ứng trên `hocmysql` và trả kết quả. 10 truy vấn chia 4 nhóm: doanh thu, sản phẩm, khách hàng, bài tập.

Thêm truy vấn mới:

1. Tạo file `backend/src/queries/<ten>.sql` chứa **một câu** `SELECT` hoặc `WITH`.
2. Thêm một dòng vào `MANIFEST` trong `backend/src/queries/index.js`.
3. Chạy `cd backend; npm test` rồi tải lại giao diện.

## API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api` | Thông tin API |
| GET | `/api/health` | Trạng thái API + kết nối MySQL |
| GET | `/api/queries` | Danh sách 10 truy vấn dashboard |
| GET | `/api/queries/:id` | Chạy truy vấn dashboard |
| GET | `/api/course` | Danh sách 9 module / 44 bài |
| GET | `/api/course/lessons/:id` | Nội dung bài + bài tập (không kèm đáp án) |
| POST | `/api/course/exercises/:id/solve` | Chấm SQL `{sql}` |
| POST | `/api/course/exercises/:id/answer` | Chấm quiz `{choice}` |
| GET | `/api/course/exercises/:id/solution` | Đáp án + giải thích |
| GET | `/api/course/exam` | Đề thi 12 câu (ẩn đáp án) |
| POST | `/api/course/exam/submit` | Nộp bài `{items:[{id, sql?|choice?}]}` → điểm, pass, chi tiết |
| GET | `/api/schema` | Schema 9 bảng `shop` |
| POST | `/api/sandbox` | Chạy SQL chỉ đọc `{sql}` |

## Cấu trúc

```
mysql-lab/
├─ .opencode/              # skill và plugin cho agent trong dự án
├─ database/
│  ├─ shop.sql             # tạo + seed database luyện tập
│  └─ reader-user.sql      # user lab_reader chỉ SELECT shop.*
├─ backend/
│  ├─ src/
│  │  ├─ config/           # env.js, db.js, readerPool.js
│  │  ├─ course/           # registry + module-01..09 + exam
│  │  ├─ queries/          # 10 file .sql + registry dashboard
│  │  ├─ routes/           # health, queries, course, schema, sandbox
│  │  ├─ services/         # runner, guard, compare, schemaExplorer
│  │  ├─ app.js
│  │  └─ server.js
│  └─ test/
├─ frontend/
│  └─ src/
│     ├─ api/client.js
│     ├─ components/       # dashboard, Course, LessonView, FinalExam,
│     │                    # Certificate, Sandbox, SchemaExplorer...
│     ├─ hooks/            # useSound
│     ├─ lib/              # format, courseProgress, notes, certificate
│     ├─ App.jsx
│     ├─ index.css
│     └─ course.css
├─ docs/superpowers/       # spec + plan
└─ README.md
```

## Kiểm thử

```powershell
cd backend
npm test          # node --test, cần MySQL đang chạy (51 test)

cd ../frontend
npm test          # Vitest (52 test)
npm run lint
npm run build
```

Test backend chạy đáp án mẫu thật trên `shop`; nếu seed `shop` thay đổi, phải chạy lại toàn bộ test.

## Ghi chú kỹ thuật

- `backend/src/config/db.js` dùng pool cho `hocmysql`; `readerPool.js` dùng user `lab_reader` cho `shop`, đặt `SET SESSION MAX_EXECUTION_TIME=2000` khi mở kết nối.
- Guard SQL là lớp phụ; hàng rào chính là quyền MySQL của `lab_reader`.
- `dateStrings: true` ở cả hai pool nên cột ngày trả về chuỗi.
- Âm thanh dùng Web Audio, bật/tắt được, lưu ở `mysql-lab:sound`.
- `dotenv` đọc `backend/.env`; file này không commit.
- Nội dung bài dùng khối có cấu trúc, không markdown/HTML thô; editor là `<textarea>` (chưa dùng CodeMirror).
