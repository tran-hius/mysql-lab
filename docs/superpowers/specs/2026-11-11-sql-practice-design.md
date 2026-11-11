# SQL Practice + Sandbox — Design

**Ngày:** 2026-11-11
**Trạng thái:** chờ duyệt
**Liên quan:** `docs/superpowers/specs/2026-11-11-query-dashboard-design.md` (dashboard hiện có)

## 1. Mục tiêu và lý do

Dashboard hiện tại chỉ chạy 10 câu SQL cố định trong backend. Người dùng muốn **thực sự luyện SQL ngay trong ứng dụng**, nên bản cập nhật này mở lại quyết định cũ "không có ô nhập SQL trên giao diện" và thêm hai chế độ:

- **Luyện tập (A):** đề bài + editor SQL + chấm tự động trên dữ liệu thật, có gợi ý và đáp án.
- **Sandbox (B):** console SQL chỉ đọc + xem schema để tự do khám phá.

Vòng lặp học: đọc đề → viết SQL → chạy trên MySQL thật → nhận phản hồi cụ thể (đúng/sai, thiếu/thừa bao nhiêu dòng) → gợi ý → xem đáp án.

Dashboard truy vấn và biểu đồ (đang gác) giữ nguyên, không bị ảnh hưởng.

## 2. Mục tiêu

- 20 đề chia 5 nhóm: Cơ bản, Nhóm & tổng hợp, JOIN, Truy vấn con, Window function.
- Chấm bài bằng **so sánh kết quả chạy thật** với kết quả của đáp án, không so chuỗi SQL.
- Sandbox chỉ đọc, có cây schema (bảng, cột, kiểu, số dòng, 3 dòng mẫu).
- Tiến độ lưu cục bộ: đã giải, số lần thử, số gợi ý, đã xem đáp án, XP.
- Không thể ghi/xoá dữ liệu từ giao diện, kể cả khi cố tình gửi SQL độc hại.
- Giữ nguyên ngôn ngữ thiết kế, âm thanh và component bảng hiện có.

## 3. Không làm (non-goals)

- Không tài khoản, không đồng bộ tiến độ lên server, không leaderboard.
- Không cho người dùng tạo bảng/ghi dữ liệu (DDL/DML) — chỉ SELECT.
- Không có biểu đồ trong bản này (đã gác lại).
- Không có syntax highlighting/autocomplete ở v1 (textarea thuần).
- Không chấm điểm theo thời gian hay tối ưu `EXPLAIN`.
- Không sửa dữ liệu `hocmysql` của dashboard.

## 4. Anti-goals (thất bại nếu)

- Bất kỳ SQL nào từ trình duyệt ghi được vào database.
- Chấm đúng/sai dựa trên so khớp chuỗi SQL (người học dùng cách viết khác vẫn phải đúng).
- Lộ đáp án trước khi người dùng bấm xem.
- Làm hỏng hoặc chậm dashboard hiện có.
- MySQL tắt giữa chừng làm treo UI thay vì báo lỗi rõ ràng.

## 5. Ràng buộc kỹ thuật

- **Database luyện tập riêng `shop`**, không dùng `hocmysql`. Lý do: `sales` là bảng phẳng, không có khoá ngoại; muốn dạy JOIN/self-join tử tế cần dữ liệu quan hệ thật. `shop` nhỏ, seed cố định, không rủi ro cho dữ liệu dashboard.
- **User MySQL chỉ đọc `lab_reader`**: chỉ `SELECT` trên `shop.*`. Đây là hàng rào chính; guard chuỗi chỉ là lớp phụ.
- Mọi câu nộp bài/sandbox: một câu duy nhất bắt đầu bằng `SELECT`/`WITH`, không `;` ở giữa, chặn `INTO OUTFILE`, `INTO DUMPFILE`, `LOAD_FILE(`, `SLEEP(`, `BENCHMARK(`, `GET_LOCK(`, `RELEASE_LOCK(`.
- Giới hạn: tối đa 200 dòng trả về UI, `MAX_EXECUTION_TIME=2000` ms ở session, timeout driver 3000 ms, pool reader riêng.
- Kết quả đáp án được tính bằng cách chạy chính câu solution qua reader, cache trong bộ nhớ theo `id` (dữ liệu tĩnh), xoá khi restart.
- Không thêm dependency runtime frontend; editor là `<textarea>`.
- Không thêm dependency runtime backend (dùng `mysql2`, `express` sẵn có).
- Nội dung tiếng Việt; dùng token màu và font hiện có.

## 6. Phương án đã cân nhắc

**A. Luyện trên `hocmysql` + view phụ, textarea, chấm bằng so kết quả.**
Rẻ, một nguồn dữ liệu, nhưng `sales` phẳng nên JOIN chỉ là giả lập; view dẫn xuất từ chính `sales` không thêm thông tin. Không chọn.

**B. Schema luyện tập riêng `shop` + textarea + chấm bằng so kết quả (đã chọn).**
Có khoá ngoại thật, self-join, dữ liệu nhỏ và cố định; dashboard không bị đụng. Đổi lại phải viết thêm script schema/seed và user đọc.

**C. Schema riêng + CodeMirror/Monaco + highlight.**
Trải nghiệm viết đẹp hơn nhưng thêm 300 KB–vài MB dependency, cấu hình test phức tạp; chưa cần cho v1. Có thể nâng cấp sau mà không đổi API.

**D. Chỉ đề bài tĩnh, chạy trong Workbench.**
Không chấm được, không đạt mục tiêu học có phản hồi. Loại.

## 7. Dữ liệu luyện tập `shop`

File `database/shop.sql` (chạy một lần bằng root), gồm schema + seed cố định:

| Bảng | Số dòng | Cột chính |
|---|---|---|
| `departments` | 4 | `id`, `name` |
| `employees` | 8 | `id`, `name`, `department_id` → departments, `manager_id` → employees (self), `salary`, `hired_at` |
| `customers` | 12 | `id`, `name`, `city`, `signed_up_at` (2 khách không có đơn) |
| `products` | 10 | `id`, `name`, `category`, `price` |
| `orders` | 25 | `id`, `customer_id` → customers, `ordered_at`, `status` (`completed`/`pending`/`cancelled`) |
| `order_items` | ~55 | `id`, `order_id` → orders, `product_id` → products, `quantity`, `unit_price` |

Seed dùng ID tường minh, ngày trong 2025-01…2025-06, không có tie ở các cột dùng để sắp hạng (hoặc đáp án có tie-breaker).

File `database/reader-user.sql` (chạy bằng root, mật khẩu lấy từ biến môi trường khi tạo):

```sql
CREATE USER IF NOT EXISTS 'lab_reader'@'localhost' IDENTIFIED BY '<DB_READER_PASSWORD>';
GRANT SELECT ON shop.* TO 'lab_reader'@'localhost';
```

`backend/.env` thêm `DB_READER_USER=lab_reader`, `DB_READER_PASSWORD=...`; `.env.example` chỉ ghi tên biến.

## 8. Nội dung 20 đề

Mỗi đề: `id`, `group`, `title`, `difficulty` (1–3), `prompt`, `hints` (đúng 3), `orderMatters` (mặc định false), `solution`.

| Nhóm | Đề |
|---|---|
| Cơ bản (4) | lọc sản phẩm theo giá; đơn theo trạng thái + khoảng ngày; thành phố khách không trùng; tìm tên sản phẩm bằng `LIKE` |
| Nhóm & tổng hợp (4) | doanh thu theo danh mục; số đơn theo tháng; khách chi trên ngưỡng (`HAVING`); giá trị đơn trung bình theo trạng thái |
| JOIN (4) | đơn kèm tên khách; doanh thu theo sản phẩm từ `order_items`; `LEFT JOIN` khách chưa từng đặt; nhân viên kèm tên quản lý (self-join) |
| Truy vấn con (4) | khách đã từng đặt hàng (`IN`/`EXISTS`); sản phẩm giá trên trung bình; khách chi trên mức trung bình; đơn có giá trị lớn hơn trung bình đơn của chính khách đó (correlated) |
| Window (4) | xếp hạng sản phẩm trong danh mục (`RANK`); doanh thu luỹ kế theo ngày (`SUM OVER`); tỷ trọng doanh thu sản phẩm (`SUM OVER ()`); đơn thứ mấy của mỗi khách (`ROW_NUMBER`) |

Quy ước chấm:

- So **multiset dòng**, bỏ qua thứ tự trừ khi `orderMatters = true` (khi đó so theo vị trí).
- Không so tên cột (alias tự do), nhưng **số cột và thứ tự cột phải khớp**.
- `NULL` bằng `NULL`.
- Giá trị số (kể cả chuỗi DECIMAL) bằng nhau nếu lệch ≤ 0.01.
- Ngày so sau khi chuẩn hoá ISO.
- Đúng khi không thiếu, không thừa dòng và số cột khớp.

**Doanh thu và trạng thái đơn:** doanh thu = `SUM(order_items.quantity * order_items.unit_price)` chỉ trên đơn có `orders.status = 'completed'`; `unit_price` là giá tại thời điểm bán và là nguồn duy nhất để tính tiền, không dùng `products.price`. Các đề về số đơn/giá trị trung bình cũng chỉ tính đơn `completed` trừ khi prompt nói khác. **Mọi prompt ghi rõ bộ lọc này.**

**Hình dạng kết quả:** mỗi prompt liệt kê rõ các cột cần trả **theo đúng thứ tự** (nhãn tiếng Việt, không phải alias) và kiểu sắp xếp nếu `orderMatters`. Challenge có trường `outputColumns: string[]` để UI hiện chip; tên alias vẫn tự do. Trả thừa cột là sai (đúng như quy ước số cột), và FeedbackBox nói rõ "yêu cầu N cột, nhận M cột" — không lộ giá trị đáp án.

Phản hồi khi sai: lý do (`ROW_COUNT`, `COLUMN_COUNT`, `ORDER`), số dòng thiếu/thừa, tối đa 3 dòng mẫu mỗi loại, số dòng đáp án; kèm kết quả người dùng (tối đa 20 dòng) để tự soi.

## 9. API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/challenges` | Danh sách 20 đề: `id, group, title, difficulty, summary`; không có prompt/hints/solution |
| GET | `/api/challenges/:id` | Chi tiết: prompt, hints (3), difficulty; **không** có solution. 404 `CHALLENGE_NOT_FOUND` |
| POST | `/api/challenges/:id/solve` | Body `{sql}`. Trả `{ok, correct, feedback, user, expectedRowCount}`; 400 `SQL_NOT_ALLOWED`; 422 `SQL_ERROR` (kèm message MySQL); 503 `DB_UNAVAILABLE` |
| GET | `/api/challenges/:id/solution` | `{ok, solution, expected:{columns, rows(≤20)}}` |
| POST | `/api/sandbox` | Body `{sql}`. Trả `{ok, columns, rows(≤200), rowCount, totalRows, truncated, durationMs}` |
| GET | `/api/schema` | `{ok, database:'shop', tables:[{name,rowCount,columns:[{name,type,nullable,key}],sampleRows}]}` |

Mọi route dùng chung middleware lỗi hiện có; lỗi mất kết nối phân loại bằng `isDatabaseUnavailable` (đã có).

## 10. Backend modules

- `backend/src/config/db.js`: thêm `readerPool` (lazy) dùng `DB_READER_*`, đặt `SET SESSION MAX_EXECUTION_TIME=2000` khi mở connection.
- `backend/src/services/practiceGuard.js`: `assertPracticeSql(sql)` — một câu SELECT/WITH, chặn danh sách từ khoá ở mục 5; lỗi `code='SQL_NOT_ALLOWED'`.
- `backend/src/services/practiceRunner.js`: `runPracticeSql(sql)` → shape giống `runQuery`, giới hạn 200 dòng, timeout 3000 ms; lỗi timeout → `code='QUERY_TIMEOUT'`.
- `backend/src/services/resultCompare.js`: `compareResults(expected, actual, {orderMatters})` thuần, có test đơn vị.
- `backend/src/services/expectedResults.js`: `getExpected(challenge)` chạy solution qua `runPracticeSql`, cache `Map`, tránh chạy trùng bằng Promise memo.
- `backend/src/challenges/index.js` + `challenges/basics.js`, `grouping.js`, `joins.js`, `subqueries.js`, `window.js`: registry `listChallenges()`, `getChallenge(id)` (không lộ solution ở list/detail).
- `backend/src/routes/challenges.routes.js`, `sandbox.routes.js`, `schema.routes.js`; gắn trong `routes/index.js`.
- `backend/src/services/schemaExplorer.js`: đọc `information_schema` + `SELECT * ... LIMIT 3` cho 6 bảng, cache trong bộ nhớ.

## 11. Frontend

Thêm thanh chọn chế độ trong header: **Bảng truy vấn / Luyện tập / Sandbox** (`aria-pressed`, mặc định Bảng truy vấn). Dashboard giữ nguyên.

### Luyện tập — `Practice.jsx`

- Cột trái: 5 nhóm đề, mỗi mục hiện dấu ✓ nếu đã giải + độ khó bằng 1–3 chấm.
- Cột phải: tiêu đề, prompt, badge nhóm/độ khó, nút "Gợi ý 1/3" mở dần, editor, nút "Chạy & chấm" (Ctrl+Enter).
- Kết quả: banner xanh "Chính xác" hoặc đỏ "Chưa đúng" + lý do + số dòng thiếu/thừa + 3 dòng mẫu + bảng kết quả của người dùng (dùng `ResultTable`).
- "Xem đáp án" hỏi xác nhận; hiện SQL + 20 dòng kết quả đáp án; đánh dấu `viewedSolution`.
- Tiến độ + XP hiện ở đầu cột trái.
- Khi chưa chọn đề: màn hình giới thiệu 5 nhóm.

### Sandbox — `Sandbox.jsx`

- Trái: schema explorer (bảng gập/mở, cột + kiểu, số dòng, 3 dòng mẫu).
- Phải: editor + "Chạy" (Ctrl+Enter), `ResultTable`, thông báo cắt dòng.
- Lỗi SQL hiện message MySQL gọn, không lộ thông tin kết nối.

### Shared

- `components/SqlEditor.jsx`: textarea mono, tự giãn, `Ctrl+Enter` chạy, đếm dòng? (không), nút chạy có trạng thái.
- `components/FeedbackBox.jsx`: banner đúng/sai + chi tiết.
- `lib/progress.js`: đọc/ghi `localStorage` khoá `mysql-lab:practice`, hàm `recordAttempt`, `recordHint`, `recordSolution`, `summarize` (đã giải, XP, chuỗi ngày).
  - Bản ghi mỗi đề: `{ attempts, hintsUsed, solvedAt, viewedSolution }`; lần đúng đầu tiên ghi `solvedAt` và cộng 10 XP (không trừ điểm, xem đáp án vẫn tính đã giải).
  - `attempts` tăng mỗi lần bấm chạy, kể cả sai/lỗi/bị chặn.
  - Chuỗi ngày = số ngày liên tiếp (theo ngày địa phương của trình duyệt) có ít nhất một đề **được giải đúng lần đầu**; tính từ hôm nay lùi về.
- `api/client.js`: thêm `getChallenges`, `getChallenge`, `solveChallenge`, `getSolution`, `runSandbox`, `getSchema`; giữ `ApiError`.
- Âm thanh: dùng bộ có sẵn — `run` khi chạy, `success` khi đúng, `error` khi sai/lỗi. Tôn trọng nút tắt.
- CSS: thêm section cho tabs, editor, feedback, schema explorer; giữ token màu; responsive < 900px xếp dọc.

## 12. Kiểm thử

**Backend (`node --test`, MySQL thật, skip nếu DB tắt):**

- `practiceGuard`: chặn ghi/nhiều câu/`INTO OUTFILE`/`SLEEP`; cho SELECT/WITH hợp lệ.
- `resultCompare`: thứ tự, multiset, thiếu/thừa, NULL, DECIMAL lệch ≤0.01, khác số cột, `orderMatters`.
- Registry: đủ 20, id duy nhất, 3 hints, solution SELECT/WITH, mọi solution chạy được trên `shop`.
- API: list không lộ solution; detail 404; solve bằng chính solution của đề → `correct: true`; solve SQL sai → `correct: false` + feedback; solve SQL ghi → 400; sandbox trả bảng + chặn ghi; schema đủ 6 bảng; solution endpoint.
- Cache expected: gọi solve 2 lần vẫn đúng.

**Frontend (Vitest):**

- `Practice`: render đề, nộp đúng hiện banner xanh; nộp sai hiện feedback; gợi ý mở dần; xem đáp án sau xác nhận.
- `Sandbox`: chạy hiện `ResultTable`; lỗi hiện message.
- `progress`: ghi/đọc/XP/streak.
- `App`: chuyển tab hiện đúng view; dashboard cũ vẫn chạy.

**Thủ công:** tạo `shop` + `lab_reader`; chạy `npm test` hai phía; thử SQL ghi trong sandbox (phải bị chặn); thử `SELECT SLEEP(5)` (phải bị chặn); tắt MySQL → lỗi rõ; kiểm tra âm thanh.

## 13. Các quyết định (có thể chỉnh)

- Schema riêng `shop` thay vì dùng `hocmysql` — vì JOIN cần khoá ngoại thật.
- Textarea thay vì CodeMirror — không thêm dependency; nâng cấp sau không đổi API.
- Tiến độ chỉ lưu `localStorage` — một người dùng, không cần backend.
- Đáp án không khoá phía server (chỉ UI xác nhận) — không phải mô hình chống gian lận.
- Kết quả đáp án cache trong RAM — dữ liệu tĩnh; restart backend là làm mới.
- 20 đề, 3 gợi ý mỗi đề, XP 10/đề (không trừ điểm).
- Doanh thu chỉ tính đơn `completed`, dùng `order_items.unit_price`; mọi prompt ghi rõ bộ lọc.
- Prompt khai báo cột đầu ra theo thứ tự; trả thừa/thiếu cột là sai.
- Chuỗi ngày tính theo ngày giải đúng đầu tiên, múi giờ trình duyệt.
- Biểu đồ hoãn sang bản sau.

## 14. Cấu trúc file mới/sửa

```
database/
├─ shop.sql                  # schema + seed + FK
└─ reader-user.sql           # user chỉ SELECT (mật khẩu điền khi chạy)
backend/src/
├─ challenges/{index,basics,grouping,joins,subqueries,window}.js
├─ config/db.js              # + readerPool
├─ routes/{challenges,sandbox,schema}.routes.js
├─ services/{practiceGuard,practiceRunner,resultCompare,expectedResults,schemaExplorer}.js
frontend/src/
├─ components/{Practice,Sandbox,SqlEditor,FeedbackBox,ModeTabs}.jsx
├─ lib/progress.js
└─ api/client.js             # + 6 hàm
```

## 15. Tiêu chí hoàn thành

- Tạo được `shop` + `lab_reader` bằng script, dashboard cũ vẫn chạy.
- 20 đề chạy được; nộp đáp án chính thức → đúng; SQL sai → phản hồi cụ thể; SQL ghi → bị chặn.
- Sandbox chạy SELECT và bị chặn mọi lệnh ghi; schema explorer đọc đúng 6 bảng.
- Tiến độ/XP lưu qua lần tải lại; âm thanh bật/tắt đúng.
- Toàn bộ test backend + frontend pass, build + lint sạch.
