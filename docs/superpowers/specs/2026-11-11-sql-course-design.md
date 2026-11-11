# SQL Course, Practice & Sandbox — Design

**Ngày:** 2026-11-11
**Trạng thái:** chờ duyệt
**Thay thế:** `docs/superpowers/specs/2026-11-11-sql-practice-design.md` (bản 20 đề rời)
**Liên quan:** `docs/superpowers/specs/2026-11-11-query-dashboard-design.md` (dashboard hiện có)

## 1. Mục tiêu và lý do

Dashboard hiện tại chỉ chạy 10 câu SQL cố định. Người dùng muốn một **khóa học SQL thực chiến trọn bộ** ngay trong ứng dụng: học lý thuyết, làm bài được chấm, ghi chú sai lầm, theo dõi tiến độ pass/fail, thi cuối khóa và nhận chứng chỉ. Đối tượng đã có 2 năm lập trình, đang đi hướng Data Science / Data Engineering / Machine Learning — nội dung phải dày, thực dụng, không dành cho người mới học lập trình.

Ba chế độ trong app:

- **Bảng truy vấn** — dashboard 10 truy vấn hiện có, giữ nguyên.
- **Khóa học** — lộ trình 9 module / 44 bài, mỗi bài có 3 khu vực riêng: **Học**, **Làm bài**, **Kết quả**; kèm ghi chú (nháp) riêng từng bài, tổng quan tiến độ, thi cuối khóa và chứng chỉ.
- **Sandbox** — console SQL chỉ đọc + schema explorer để tự do khám phá.

Biểu đồ cho dashboard vẫn hoãn sang bản sau.

## 2. Mục tiêu

- Lộ trình **44 bài / 9 module** phủ từ nền tảng đến nâng cao, không bỏ sót chủ đề SQL quan trọng cho analytics/DE/ML.
- **53 bài tập được chấm** (44 bài tập gắn bài học + 9 quiz module) + **đề thi cuối khóa 12 câu**.
- Ba khu vực tách biệt trong mỗi bài: Học (lý thuyết + note), Làm bài (editor/quiz + gợi ý), Kết quả (chấm điểm, lịch sử, trạng thái pass).
- Ghi chú riêng từng bài, tự lưu, dùng để ghi sai lầm/kiến thức; xuất toàn bộ note ra Markdown.
- Tổng quan khóa: % hoàn thành, pass/fail từng module, điểm thi, điều kiện chứng chỉ.
- Chứng chỉ cuối khóa tự thiết kế (SVG), in được PDF A4 ngang, có tên, ngày, mã chứng chỉ.
- Sandbox chỉ đọc, có schema explorer.
- Không thể ghi/xoá dữ liệu từ trình duyệt.

## 3. Không làm (non-goals)

- Không tài khoản, không đồng bộ tiến độ lên server, không leaderboard.
- Không video, không chấm tự luận, không AI feedback.
- Không cho DDL/DML trên dữ liệu thật (chỉ SELECT; DML/DDL học qua lý thuyết + quiz).
- Không biểu đồ (bản sau).
- Không syntax highlighting/autocomplete v1 (textarea).
- Không đo thời gian chạy để chấm điểm hiệu năng (không ổn định); hiệu năng dạy qua EXPLAIN/lý thuyết/viết lại đúng kết quả.
- Không sửa dữ liệu `hocmysql` của dashboard.

## 4. Anti-goals (thất bại nếu)

- SQL từ trình duyệt ghi/xoá được database.
- Chấm đúng/sai bằng so chuỗi SQL thay vì so kết quả.
- Lộ đáp án/đáp án quiz trước khi người dùng chủ động xem.
- Note hoặc tiến độ mất khi tải lại trang.
- Chứng chỉ cấp được khi chưa pass đủ điều kiện.
- Dashboard cũ hỏng hoặc chậm.

## 5. Đối tượng và độ khó

- Nền 2 năm lập trình: không giải thích biến, vòng lặp, kiểu dữ liệu cơ bản của ngôn ngữ.
- SQL vẫn đi từ nền tảng nhưng **cô đọng, thực chiến**: mỗi khái niệm gắn với bài toán dữ liệu thật (doanh thu, funnel, cohort, RFM, feature table, data quality).
- Bài tập đòi hỏi viết query hoàn chỉnh, không phải điền chỗ trống.
- Module cuối hướng DE/ML: incremental load, SCD2, leakage, percentile.

## 6. Lộ trình 44 bài

| Module | Bài | Nội dung cốt lõi |
|---|---|---|
| **1. Nền tảng thực chiến** (5) | 1. SELECT, biểu thức, alias · 2. WHERE & logic ba trị · 3. ORDER BY, LIMIT, tie-breaker · 4. CASE, chuỗi, ngày · 5. Kiểu dữ liệu & ép kiểu | DECIMAL vs FLOAT, NULL, collation, DATEDIFF/DATE_FORMAT |
| **2. Tổng hợp & nhóm** (5) | 1. Aggregate & NULL · 2. GROUP BY · 3. HAVING & thứ tự thực thi · 4. Conditional aggregation/pivot · 5. WITH ROLLUP | COUNT(*)/COUNT(col), ONLY_FULL_GROUP_BY, SUM(CASE) |
| **3. JOIN & quan hệ** (5) | 1. INNER JOIN · 2. LEFT/RIGHT JOIN · 3. Nhiều bảng & fan-out · 4. Self join · 5. Anti/semi join | ON vs WHERE, NOT EXISTS, LEFT IS NULL |
| **4. Subquery & CTE** (5) | 1. Subquery vô hướng/IN · 2. Correlated · 3. Derived table & CTE · 4. Recursive CTE · 5. UNION/INTERSECT/EXCEPT | date spine, cây quản lý |
| **5. Window functions** (6) | 1. OVER/PARTITION · 2. Ranking · 3. Running total & frame · 4. LAG/LEAD · 5. Tỷ trọng & NTILE · 6. Top-N mỗi nhóm & dedup | ROW_NUMBER/RANK/DENSE_RANK, ROWS vs RANGE |
| **6. Analytics sản phẩm** (5) | 1. Time series & date spine · 2. Cohort retention · 3. Funnel · 4. RFM · 5. KPI so sánh kỳ | MoM, moving average, retention matrix |
| **7. Hiệu năng & tối ưu** (4) | 1. Index (B-tree, composite, covering) · 2. EXPLAIN · 3. Sargability & viết lại · 4. Phân trang & query nặng | keyset pagination, EXISTS vs IN |
| **8. Mô hình & vận hành** (4) | 1. Chuẩn hoá vs star schema · 2. View & quyền · 3. Transaction/isolation · 4. JSON & generated column | grain, ACID, deadlock |
| **9. DE/ML thực chiến** (5) | 1. Idempotent upsert & dedup · 2. Data quality checks · 3. Incremental load/watermark · 4. SCD Type 2 · 5. Feature table & leakage | dedup ROW_NUMBER, as-of join, percentile |

Mỗi bài có: mục tiêu, 4–7 khối nội dung (đoạn văn, bullet, code SQL, bảng, callout "bẫy"/"mẹo"), 1 bài tập chấm điểm, 3 gợi ý. Mỗi module có 1 quiz tổng kết 4 lựa chọn. Cuối khóa: đề thi 12 câu (8 SQL + 4 quiz) trải đều 9 module.

## 7. Ba khu vực trong một bài

- **Học:** nội dung bài + panel ghi chú bên phải (textarea, tự lưu 600 ms, đếm ký tự, nút "Xuất tất cả ghi chú .md"). Note lưu riêng từng bài.
- **Làm bài:** đề bài, yêu cầu cột đầu ra, editor SQL (Ctrl+Enter) hoặc quiz; nút "Chạy & chấm"; 3 gợi ý mở dần; nút xem đáp án có xác nhận. Không hiện kết quả chấm ở đây ngoài banner ngắn.
- **Kết quả:** trạng thái pass/fail của bài, số lần thử, gợi ý đã dùng, lịch sử 10 lần gần nhất (thời điểm, đúng/sai, SQL rút gọn), điểm XP, nút "Bài tiếp theo". Với quiz: đáp án đúng + giải thích sau khi nộp.

Trang **Tổng quan khóa** (mặc định khi vào Khóa học): % hoàn thành, 9 module với thanh tiến độ pass/fail, số bài đã pass, điểm thi cao nhất, điều kiện chứng chỉ, nút thi cuối khóa, khu vực chứng chỉ.

## 8. Dữ liệu luyện tập `shop`

Database riêng, seed cố định, có khoá ngoại thật. File `database/shop.sql` (schema + seed + index), chạy một lần bằng root.

| Bảng | ~Số dòng | Cột |
|---|---|---|
| `departments` | 4 | `id`, `name` |
| `employees` | 8 | `id`, `name`, `department_id` FK, `manager_id` FK self, `salary`, `hired_at` |
| `customers` | 12 | `id`, `name`, `city`, `signed_up_at` (2 khách chưa có đơn) |
| `products` | 10 | `id`, `name`, `category`, `price` |
| `orders` | 25 | `id`, `customer_id` FK, `ordered_at`, `status` (`completed`/`pending`/`cancelled`) |
| `order_items` | ~55 | `id`, `order_id` FK, `product_id` FK, `quantity`, `unit_price` |
| `payments` | ~20 | `id`, `order_id` FK, `paid_at`, `amount`, `method`, `status` |
| `events` | ~120 | `id`, `customer_id` FK, `event_type` (`view`/`add_to_cart`/`checkout`/`purchase`), `occurred_at`, `metadata` JSON |
| `product_price_history` | ~20 | `product_id` FK, `price`, `valid_from`, `valid_to` (SCD2) |

Index phục vụ bài hiệu năng: `orders(customer_id)`, `orders(ordered_at)`, `order_items(order_id, product_id)`, `events(customer_id, occurred_at)`, `payments(order_id)`, `product_price_history(product_id, valid_from)`.

Seed dùng ID tường minh, ngày 2025-01…2025-06, không tie ở cột sắp hạng (hoặc đáp án có tie-breaker).

### User chỉ đọc

`database/reader-user.sql` chạy bằng root, mật khẩu lấy từ `DB_READER_PASSWORD`:

```sql
CREATE USER IF NOT EXISTS 'lab_reader'@'localhost' IDENTIFIED BY '<DB_READER_PASSWORD>';
GRANT SELECT ON shop.* TO 'lab_reader'@'localhost';
```

`backend/.env` thêm `DB_READER_USER`, `DB_READER_PASSWORD`; `.env.example` chỉ ghi tên biến.

## 9. Chấm điểm

### SQL

- Chạy SQL người học trên `shop` qua reader, so **kết quả** với đáp án (đáp án chạy cùng runner, cache RAM theo exercise id).
- So multiset dòng; `orderMatters = true` thì so theo vị trí.
- Alias tự do; **số cột và thứ tự cột phải khớp**.
- `NULL` = `NULL`; số (kể cả DECIMAL dạng chuỗi) bằng nếu lệch ≤ 0.01; ngày chuẩn hoá ISO.
- Đúng khi không thiếu/thừa dòng và số cột khớp.
- Phản hồi sai: lý do (`ROW_COUNT`, `COLUMN_COUNT`, `ORDER`), số thiếu/thừa, tối đa 3 dòng mẫu mỗi loại, số dòng đáp án, kết quả người dùng (≤20 dòng).
- **Doanh thu** = `SUM(order_items.quantity * order_items.unit_price)` trên đơn `completed`; `unit_price` là nguồn duy nhất; mọi prompt ghi rõ bộ lọc.
- Mỗi prompt khai báo **cột đầu ra theo thứ tự** (`outputColumns: string[]`) và kiểu sắp xếp nếu có.

### Quiz

- 4 lựa chọn, server giữ đáp án; nộp mới trả đúng/sai + giải thích. Không gửi đáp án trong `GET`.

### Thi cuối khóa

- 12 câu cố định (8 SQL + 4 quiz), trải đều module; không giới hạn thời gian, làm lại được.
- Nộp một lần cả đề; server chấm từng câu, trả điểm %, điểm từng câu, giải thích quiz, feedback SQL. Đạt khi ≥ 80%.

## 10. Tiến độ & điều kiện pass

Lưu `localStorage`:

- `mysql-lab:course` — `{version, lessons, exam, certificate}`.
- `mysql-lab:notes:<lessonId>` — `{text, updatedAt}`.

Bản ghi bài tập: `{passed, attempts, hintsUsed, viewedSolution, lastAt, history:[{at, correct, sql?, choice?}]}`; history tối đa 10, SQL tối đa 2000 ký tự.

Quy tắc:

- **Bài tập pass** khi có ít nhất một lần đúng (xem đáp án vẫn tính pass, nhưng có cờ `viewedSolution`).
- **Bài học pass** khi mọi bài tập của bài đều pass.
- **Module pass** khi mọi bài học trong module pass.
- **Khóa học pass** khi 9/9 module pass **và** điểm thi cao nhất ≥ 80%.
- XP: 10 điểm cho lần pass đầu tiên mỗi bài tập; không trừ điểm.
- Chuỗi ngày: số ngày liên tiếp (giờ địa phương) có ít nhất một bài tập pass lần đầu.
- `attempts` tăng mỗi lần bấm chạy/nộp, kể cả lỗi hoặc bị chặn.

## 11. Chứng chỉ

- Mở khi **khóa học pass** và người dùng nhập họ tên.
- Thiết kế SVG A4 ngang (1400×990): nền navy `#0E1620`, viền và hoa văn vàng đồng `#D4A24A`, wordmark MySQL Lab, tiêu đề "Chứng nhận hoàn thành khóa học", tên người học, tên khóa **"SQL Thực Chiến cho Data"**, số bài đã pass, điểm thi, ngày cấp, mã chứng chỉ, con dấu và dòng ký "MySQL Lab".
- Mã chứng chỉ: `SQLLAB-2026-` + 6 ký tự base36 từ hash(tên + ngày + điểm), in hoa.
- Tải `.svg`; nút "In / Lưu PDF" dùng CSS `@media print` khổ A4 ngang.
- Lưu bản chụp thông tin vào `mysql-lab:course.certificate` để xem lại; nếu sửa tên phải cấp lại (mã đổi).
- Ghi rõ trong UI: chứng chỉ do ứng dụng cục bộ cấp, không phải chứng chỉ được công nhận bên ngoài.

## 12. UI

Header thêm chế độ: **Bảng truy vấn / Khóa học / Sandbox** (`aria-pressed`, mặc định Bảng truy vấn). StatusBar và nút âm thanh giữ nguyên.

### Khóa học

- Cột trái: lộ trình 9 module, bài học với dấu ✓/đang học/chưa pass; đầu cột có % hoàn thành và XP.
- Giữa: nội dung bài với 3 tab **Học / Làm bài / Kết quả**; tab Học có panel note bên phải (thu gọn được).
- Tab Kết quả hiển thị điểm/badge pass, lịch sử, gợi ý đã dùng, nút bài tiếp.
- Trang Tổng quan: tiến độ module, điều kiện chứng chỉ, thi cuối khóa.
- Trang Chứng chỉ: khóa khi chưa đủ điều kiện (nêu rõ còn thiếu gì); mở khóa thì form tên + chứng chỉ + tải/in.

### Sandbox

- Trái: schema explorer 9 bảng (cột, kiểu, số dòng, 3 dòng mẫu).
- Phải: editor + Chạy (Ctrl+Enter), `ResultTable`, thông báo cắt dòng; lỗi SQL hiện message gọn.

### Shared

- `LessonContent.jsx` render khối nội dung có cấu trúc (p, h3, bullets, code, table, callout, steps) — không dùng markdown/HTML thô, không thêm dependency.
- `SqlEditor.jsx` textarea mono + Ctrl+Enter; `FeedbackBox.jsx` banner đúng/sai; `ProgressBar`, `StatusPill`, `Certificate.jsx` (SVG).
- Âm thanh: dùng bộ có sẵn — `run` khi chạy, `success` khi đúng, `error` khi sai; tôn trọng nút tắt.
- CSS giữ token màu hiện có; responsive < 900px xếp dọc, tab cuộn ngang.

## 13. API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/course` | 9 module, tóm tắt 44 bài, số bài tập; không lộ nội dung/đáp án |
| GET | `/api/course/lessons/:id` | Nội dung khối học + bài tập (prompt, outputColumns, hints, loại); không có solution/answer. 404 `LESSON_NOT_FOUND` |
| POST | `/api/course/exercises/:id/solve` | `{sql}` → `{correct, feedback, user, expectedRowCount}`; 400 `SQL_NOT_ALLOWED`, 422 `SQL_ERROR`, 503 |
| POST | `/api/course/exercises/:id/answer` | `{choice}` → `{correct, explanation}`; 400 `INVALID_CHOICE` |
| GET | `/api/course/exercises/:id/solution` | SQL đáp án + kết quả mẫu (SQL) hoặc đáp án + giải thích (quiz) |
| GET | `/api/course/exam` | 12 câu, không lộ đáp án/giải thích |
| POST | `/api/course/exam/submit` | `{items:[{id, sql?|choice?}]}` → `{score, passed, items:[{id, correct, feedback|explanation}]}` |
| GET | `/api/schema` | 9 bảng `shop`: cột, kiểu, nullable, key, số dòng, 3 dòng mẫu |
| POST | `/api/sandbox` | `{sql}` → `{columns, rows≤200, rowCount, totalRows, truncated, durationMs}` |

Lỗi mất kết nối dùng `isDatabaseUnavailable` → 503 `DB_UNAVAILABLE`.

## 14. Backend modules

- `config/db.js`: thêm `readerPool` (lazy) dùng `DB_READER_*`, `SET SESSION MAX_EXECUTION_TIME=2000` khi mở connection.
- `services/practiceGuard.js`: `assertPracticeSql(sql)` — một câu, cho `SELECT`/`WITH` (sandbox cho thêm `EXPLAIN`), chặn `;` giữa câu, `INTO OUTFILE/DUMPFILE`, `LOAD_FILE(`, `SLEEP(`, `BENCHMARK(`, `GET_LOCK(`, `RELEASE_LOCK(`; lỗi `SQL_NOT_ALLOWED`.
- `services/practiceRunner.js`: `runPracticeSql(sql)` → shape giống `runQuery`, tối đa 200 dòng, timeout 3000 ms, lỗi timeout `QUERY_TIMEOUT`.
- `services/resultCompare.js`: `compareResults(expected, actual, {orderMatters})` thuần.
- `services/expectedResults.js`: chạy solution qua runner, cache `Map` + Promise memo.
- `services/schemaExplorer.js`: đọc `information_schema` + `SELECT * LIMIT 3`, cache.
- `course/index.js` + `course/module-01.js`…`module-09.js` + `course/exam.js`: registry `listCourse()`, `getLesson(id)`, `getExercise(id)`, `getExam()`; validator khi khởi động (id duy nhất, đủ 44 bài, hints, solution SELECT/WITH, quiz có 4 lựa chọn).
- `routes/course.routes.js`, `sandbox.routes.js`, `schema.routes.js`; gắn vào `routes/index.js`.

## 15. Frontend modules

- `components/ModeTabs.jsx`, `Course.jsx`, `Roadmap.jsx`, `LessonView.jsx`, `LessonContent.jsx`, `NotesPanel.jsx`, `ExercisePanel.jsx`, `QuizPanel.jsx`, `LessonResults.jsx`, `CourseOverview.jsx`, `FinalExam.jsx`, `Certificate.jsx`, `Sandbox.jsx`, `SchemaExplorer.jsx`, `SqlEditor.jsx`, `FeedbackBox.jsx`.
- `lib/courseProgress.js`: đọc/ghi tiến độ, pass rules, XP, streak, điều kiện chứng chỉ; `lib/notes.js`: lưu/đọc/xuất note; `lib/certificate.js`: mã chứng chỉ + snapshot.
- `api/client.js`: thêm `getCourse`, `getLesson`, `solveExercise`, `answerQuiz`, `getExerciseSolution`, `getExam`, `submitExam`, `getSchema`, `runSandbox`.
- `App.jsx`: chuyển chế độ, giữ dashboard hiện có; âm thanh dùng chung.

## 16. Bảo mật

- Hàng rào chính là user `lab_reader` chỉ `SELECT` trên `shop.*`; guard chuỗi là lớp phụ.
- Không nhận SQL từ client cho dashboard; chỉ nhận cho solve/sandbox/exam.
- Giới hạn 200 dòng, 2 giây/session, timeout 3 giây, pool riêng.
- Lỗi trả về không chứa thông tin kết nối/mật khẩu.
- Quiz/exam không trả đáp án trước khi nộp; solution endpoint chỉ UI xác nhận (không chống gian lận — ghi rõ).

## 17. Kiểm thử

**Backend (`node --test`, MySQL thật, skip nếu tắt):**

- Guard: chặn ghi/nhiều câu/OUTFILE/SLEEP; cho SELECT/WITH/EXPLAIN.
- Compare: multiset, thứ tự, thiếu/thừa, NULL, DECIMAL ≤0.01, khác số cột.
- Registry: 9 module, 44 bài id duy nhất, mỗi bài ≥1 bài tập, 3 hints, quiz 4 lựa chọn + giải thích, mọi solution chạy được trên `shop`.
- API: course không lộ đáp án; lesson 404; solve bằng solution → đúng; solve sai → feedback; quiz đúng/sai; solution; exam đủ 12 câu và chấm đúng; sandbox chặn ghi; schema đủ 9 bảng.
- Cache expected: solve 2 lần vẫn đúng.

**Frontend (Vitest):**

- `courseProgress`: pass rules, XP, streak, điều kiện chứng chỉ.
- `LessonContent`: render đủ loại khối, không chèn HTML thô.
- `NotesPanel`: tự lưu/đọc lại, xuất .md.
- `ExercisePanel`: nộp đúng/sai hiện feedback; gợi ý mở dần; xem đáp án sau xác nhận.
- `LessonView`: 3 tab đúng nội dung; `CourseOverview`; `FinalExam`; `Certificate` (khóa/mở, tên, mã, SVG); `Sandbox`; `App` chuyển chế độ, dashboard cũ vẫn chạy.

**Thủ công:** tạo `shop` + `lab_reader`; chạy toàn bộ test; thử SQL ghi và `SLEEP(5)` (bị chặn); tắt MySQL (lỗi rõ); đi hết một module; thi thử; cấp chứng chỉ; in PDF; note khôi phục sau reload; âm thanh.

## 18. Các quyết định (có thể chỉnh)

- Database luyện tập riêng `shop` (JOIN/self-join/SCD cần khoá ngoại thật).
- 44 bài / 53 bài tập chấm / 12 câu thi; nội dung nằm trong backend.
- Nội dung bài dạng khối có cấu trúc, không markdown/HTML thô, không thêm dependency.
- Textarea thay CodeMirror v1.
- Note và tiến độ chỉ ở `localStorage`; xuất note .md.
- Chấm hiệu năng bằng lý thuyết/EXPLAIN, không đo thời gian.
- Chứng chỉ cục bộ, không công nhận bên ngoài; điều kiện 9/9 module + thi ≥80%.
- Biểu đồ hoãn.

## 19. Tiêu chí hoàn thành

- `shop` + `lab_reader` tạo bằng script; dashboard cũ vẫn chạy.
- 44 bài hiển thị đủ, 53 bài tập chấm được, quiz và thi cuối khóa hoạt động.
- 3 tab Học/Làm bài/Kết quả tách biệt; note tự lưu và xuất được.
- Tổng quan pass/fail từng module, điều kiện chứng chỉ đúng.
- Chứng chỉ chỉ mở khi đủ điều kiện, tải SVG và in PDF được.
- Sandbox chặn mọi lệnh ghi; EXPLAIN chạy được.
- Toàn bộ test backend + frontend pass, build + lint sạch.

## 20. Thứ tự triển khai dự kiến

1. `shop` + reader user + guard/runner/compare + sandbox + schema explorer.
2. Khung course registry + 44 bài nội dung + bài tập (chia 9 module, commit theo module).
3. UI Khóa học 3 tab + note + tiến độ + tổng quan.
4. Đề thi cuối khóa + chứng chỉ + xuất/in.
5. QA đầu-cuối, README, push.
