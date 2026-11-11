# SQL Course + Practice + Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm khóa học SQL 44 bài có chấm điểm, ghi chú, thi cuối khóa, chứng chỉ và sandbox chỉ đọc vào MySQL Lab, không làm hỏng dashboard hiện có.

**Architecture:** Database luyện tập riêng `shop` + user MySQL chỉ SELECT. Backend giữ nội dung khóa học trong registry JS, chạy SQL người học qua reader pool, chấm bằng so kết quả với đáp án. Frontend thêm 2 chế độ Khóa học/Sandbox bên cạnh dashboard, lưu tiến độ và ghi chú trong `localStorage`, cấp chứng chỉ SVG cục bộ.

**Tech Stack:** Node 24, Express 5, mysql2, MySQL 8.4; React 19, Vite 8; `node --test`, Vitest + Testing Library. Không thêm dependency runtime.

**Spec:** `docs/superpowers/specs/2026-11-11-sql-course-design.md`

## Global Constraints

- Người dùng `lab_reader@localhost` chỉ có `SELECT ON shop.*`; mật khẩu đọc từ `backend/.env`, không commit.
- SQL nhận từ client: một câu, bắt đầu `SELECT`/`WITH` (sandbox cho thêm `EXPLAIN`), không `;` giữa câu, chặn `INTO OUTFILE`, `INTO DUMPFILE`, `LOAD_FILE(`, `SLEEP(`, `BENCHMARK(`, `GET_LOCK(`, `RELEASE_LOCK(`.
- Tối đa 200 dòng trả UI, `MAX_EXECUTION_TIME=2000`, timeout driver 3000 ms, pool reader riêng.
- Chấm SQL bằng so kết quả: multiset dòng, `orderMatters` mới so vị trí; alias tự do; số cột/thứ tự khớp; NULL = NULL; số lệch ≤ 0.01; ngày ISO.
- Doanh thu = `SUM(order_items.quantity * order_items.unit_price)` trên `orders.status='completed'`; mọi prompt ghi rõ.
- Mỗi prompt SQL khai báo `outputColumns` theo thứ tự; không lộ solution/answer trong GET.
- 44 bài, 53 bài tập (44 SQL + 9 quiz), 9 module, thi 12 câu (8 SQL + 4 quiz), đạt ≥ 80%.
- Tiến độ/ghi chú chỉ `localStorage`: khóa `mysql-lab:course`, `mysql-lab:notes:<lessonId>`.
- Chứng chỉ: 9/9 module pass + thi ≥ 80%; SVG A4 ngang navy `#0E1620`/vàng `#D4A24A`; mã `SQLLAB-2026-` + 6 ký tự base36.
- Không thêm dependency frontend/backend; editor là `<textarea>`; biểu đồ không thuộc bản này.
- Dashboard hiện có (10 truy vấn) phải tiếp tục chạy và test xanh sau mọi thay đổi.

## Review Focus

- Người học trả đúng dữ liệu nhưng sai thứ tự cột → phải báo `COLUMN_COUNT`, không pass.
- SQL ghi/`SLEEP`/`OUTFILE` gửi từ trình duyệt → 400, database không đổi.
- MySQL tắt giữa chừng → 503 + UI báo lỗi, không treo, không mất ghi chú.
- Ghi chú gõ xong tải lại trang ngay → không mất (autosave).
- Thi đạt 79% hoặc chưa pass đủ module → chứng chỉ vẫn khóa và nêu rõ còn thiếu.

---

### Task 1: Database `shop` + reader user

**Files:**
- Create: `database/shop.sql`, `database/reader-user.sql`
- Modify: `backend/.env.example`, `backend/.env` (không commit)

**Interfaces:**
- Produces: schema `shop` với 9 bảng và dữ liệu seed; user `lab_reader` chỉ SELECT.

- [ ] **Step 1: Viết `database/shop.sql`** — schema 9 bảng (departments, employees, customers, products, orders, order_items, payments, events, product_price_history), khoá ngoại, index theo spec §8, seed đủ số dòng. Payments sinh bằng `INSERT … SELECT` từ order_items để luôn khớp, sau đó cố ý lệch 1 dòng cho bài data quality.
- [ ] **Step 2: Chạy bằng root**, kiểm tra: 9 bảng; 12 khách; 10 sản phẩm; 25 đơn; 18 completed; khách 11,12 không có đơn; `SELECT COUNT(*)` từng bảng khớp spec.
- [ ] **Step 3: Viết `database/reader-user.sql`** (placeholder mật khẩu) và tạo user thật từ `.env`.
- [ ] **Step 4: Kiểm tra quyền**: `SELECT` được `shop.orders`; `INSERT` bị từ chối; `SELECT` trên `hocmysql` bị từ chối.
- [ ] **Step 5: Commit** `feat(db): schema shop va user chi doc`.

---

### Task 2: Reader pool, guard, runner, compare

**Files:**
- Create: `backend/src/config/readerPool.js`, `backend/src/services/practiceGuard.js`, `practiceRunner.js`, `resultCompare.js`
- Test: `backend/test/practiceGuard.test.js`, `resultCompare.test.js`, `practiceRunner.test.js`

**Interfaces:**
- Produces:
  - `readerPool` (mysql2 pool, lazy).
  - `assertPracticeSql(sql, {allowExplain=false}): void` — lỗi `code='SQL_NOT_ALLOWED'`.
  - `runPracticeSql(sql, {maxRows=200}): Promise<{columns, rows, rowCount, totalRows, truncated, durationMs}>` — timeout `code='QUERY_TIMEOUT'`.
  - `compareResults(expected, actual, {orderMatters=false}): {correct, reason, expectedRowCount, actualRowCount, missing, extra}`; `reason ∈ null|'ROW_COUNT'|'COLUMN_COUNT'|'ORDER'`.

- [ ] **Step 1: Viết test thất bại** cho guard (chặn `DELETE`, `WITH … DELETE`, `SELECT 1; SELECT 2`, `INTO OUTFILE`, `SLEEP(`, `LOAD_FILE(`, `BENCHMARK(`; cho `SELECT`, `WITH`, `EXPLAIN SELECT` khi `allowExplain`), compare (multiset, order, NULL, `'1859208.90'` vs `'1859208.91'`, khác cột, thiếu/thừa), runner (chạy `SELECT 1 AS x`, `SELECT * FROM orders LIMIT 5`, cắt 200, timeout).
- [ ] **Step 2: Chạy test, xác nhận fail.**
- [ ] **Step 3: Implement 4 file**, đóng pool trong `test.after`.
- [ ] **Step 4: Chạy `npm test` — tất cả pass (kể cả 14 test cũ).**
- [ ] **Step 5: Commit** `feat(api): runner chi doc va so khop ket qua`.

---

### Task 3: Sandbox + schema API

**Files:**
- Create: `backend/src/services/schemaExplorer.js`, `backend/src/routes/sandbox.routes.js`, `schema.routes.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/test/sandbox.api.test.js`

**Interfaces:**
- Produces:
  - `POST /api/sandbox {sql}` → shape `runPracticeSql`; 400 `SQL_NOT_ALLOWED`; 422 `SQL_ERROR {message}`; 503 `DB_UNAVAILABLE`.
  - `GET /api/schema` → `{ok, database:'shop', tables:[{name,rowCount,columns:[{name,type,nullable,key}],sampleRows}]}`.
  - `getSchema(): Promise<Schema>` cache RAM.

- [ ] **Step 1: Viết test thất bại** (sandbox trả cột/dòng; `DELETE` → 400; SQL sai → 422; schema đủ 9 bảng, có `orders.status`).
- [ ] **Step 2: Chạy test, xác nhận fail.**
- [ ] **Step 3: Implement + gắn route.**
- [ ] **Step 4: `npm test` pass.**
- [ ] **Step 5: Commit** `feat(api): sandbox va schema explorer`.

---

### Task 4: Course registry + Module 1–2

**Files:**
- Create: `backend/src/course/index.js`, `course/module-01.js`, `course/module-02.js`
- Test: `backend/test/course.registry.test.js`

**Interfaces:**
- Produces:
  - Module: `{id:'m1', title, summary, lessons:[Lesson]}`; Lesson: `{id, title, goal, blocks:Block[], exercises:Exercise[]}`.
  - `Block` types: `p`, `h3`, `list`, `code`, `table`, `callout`, `steps`.
  - SQL exercise: `{id, type:'sql', title, prompt, outputColumns:string[], orderMatters:boolean, hints:[string,string,string], solution:string}`.
  - Quiz: `{id, type:'quiz', title, prompt, options:[string,string,string,string], answer:number, explanation:string}`.
  - `listCourse(): {id,title,summary,lessons:[{id,title,goal,exerciseCount}]}[]`; `getLesson(id)`; `findExercise(id)`; `allModules`.
  - `validateCourse(): string[]` (lỗi cấu trúc).

- [ ] **Step 1: Viết test thất bại** — 44 bài khi đủ 9 module; hiện tại 10 bài/2 module; mỗi bài có ≥1 exercise; mọi SQL solution bắt đầu SELECT/WITH và chạy được trên `shop`; quiz có 4 lựa chọn + `answer` 0–3; hints đúng 3; `validateCourse()` trả `[]`.
- [ ] **Step 2: Chạy test, xác nhận fail.**
- [ ] **Step 3: Viết module 1 (5 bài) + module 2 (5 bài)**, mỗi bài 4–6 block, 1 SQL exercise + 3 hints; cuối mỗi module gắn quiz vào bài cuối (2 exercise). Nội dung cô đọng, ví dụ trên `shop`.
- [ ] **Step 4: `npm test` pass registry (test tổng 44 sẽ fail có chủ đích — đánh dấu `test.todo` cho tới Task 6? Không: viết test theo số module hiện có bằng cách đọc `allModules` và assert `lessons.length === 44` sẽ fail. Dùng test riêng `course.complete.test.js` thêm ở Task 6; Task 4 test cấu trúc trên module hiện có.)**
- [ ] **Step 5: Commit** `feat(course): module 1-2 va registry`.

---

### Task 5: Module 3–5

**Files:** Create `course/module-03.js`, `04.js`, `05.js`; Modify `course/index.js`.

- [ ] **Step 1: Viết test** đếm module/bài hiện có (3 module/15 bài → 5 module/26 bài) và mọi solution chạy được.
- [ ] **Step 2: Chạy test fail.**
- [ ] **Step 3: Viết module JOIN (5), Subquery/CTE (5), Window (6)**; quiz cuối mỗi module.
- [ ] **Step 4: `npm test` pass.**
- [ ] **Step 5: Commit** `feat(course): module join, cte, window`.

---

### Task 6: Module 6–9 + exam + completeness

**Files:** Create `course/module-06.js`…`module-09.js`, `course/exam.js`; Modify `course/index.js`; Test `backend/test/course.complete.test.js`.

- [ ] **Step 1: Viết test thất bại** — 9 module, 44 bài, id duy nhất toàn khóa; 44 SQL + 9 quiz = 53 bài tập; mọi solution chạy được; exam 12 câu (8 SQL + 4 quiz), mỗi module có ít nhất 1 câu; `getExam()` không lộ `answer`/`solution`/`explanation`.
- [ ] **Step 2: Chạy test fail.**
- [ ] **Step 3: Viết module 6–9 (19 bài) + exam.**
- [ ] **Step 4: `npm test` pass toàn bộ.**
- [ ] **Step 5: Commit** `feat(course): hoan tat 44 bai va de thi`.

---

### Task 7: Course API

**Files:**
- Create: `backend/src/services/expectedResults.js`, `backend/src/routes/course.routes.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/test/course.api.test.js`

**Interfaces:**
- Produces:
  - `getExpected(spec)` — cache theo `spec.id`, chạy `spec.solution` qua `runPracticeSql`.
  - `GET /api/course`; `GET /api/course/lessons/:id`; `GET /api/course/exercises/:id/solution`.
  - `POST /api/course/exercises/:id/solve {sql}` → `{correct, feedback, user, expectedRowCount}`.
  - `POST /api/course/exercises/:id/answer {choice}` → `{correct, explanation}`.
  - `GET /api/course/exam`; `POST /api/course/exam/submit {items:[{id, sql?|choice?}]}` → `{score, passed, items:[...]}`, score 0–100, passed ≥ 80.
  - `feedback = {reason, missingCount, extraCount, expectedRowCount, samples:{missing,extra}}`.

- [ ] **Step 1: Viết test thất bại** — list không lộ prompt/solution; lesson 404, không có solution; solve bằng solution → đúng; solve sai → `correct:false` + reason; solve `DELETE` → 400; quiz đúng/sai; solution endpoint; exam đủ 12 câu không lộ đáp án; submit đúng hết → 100/passed; submit thiếu → 422.
- [ ] **Step 2: Chạy test fail.**
- [ ] **Step 3: Implement + gắn `/api/course`.**
- [ ] **Step 4: `npm test` pass.**
- [ ] **Step 5: Commit** `feat(api): cham bai, quiz va thi cuoi khoa`.

---

### Task 8: Frontend libs (progress, notes, certificate)

**Files:**
- Create: `frontend/src/lib/courseProgress.js`, `notes.js`, `certificate.js`
- Test: `courseProgress.test.js`, `notes.test.js`, `certificate.test.js`

**Interfaces:**
- Produces:
  - `loadProgress()`, `saveProgress(p)`, `recordExercise(progress, {lessonId, exerciseId, correct, sql, choice})`.
  - `isLessonPassed(progress, lesson)`; `summarize(course, progress)` → `{lessonsPassed, lessonsTotal, exercisesPassed, exercisesTotal, xp, streak, modules:[{id,title,passed,lessonsPassed,lessonsTotal}], coursePassed}`.
  - `loadNote(id)`, `saveNote(id, text)`, `exportNotes(course) : string` (Markdown).
  - `createCertificate({name, score, exercisesPassed, lessonsPassed, issuedAt})` → snapshot; `certificateId(name, issuedAt, score)` → `SQLLAB-2026-XXXXXX`; `canIssue(progress, course)`.

- [ ] **Step 1: Viết test thất bại** — pass rules, XP 10/lần đầu, streak, exam <80 chặn chứng chỉ, note lưu/đọc/xuất, mã chứng chỉ đúng format và đổi khi đổi tên.
- [ ] **Step 2: Chạy fail.**
- [ ] **Step 3: Implement thuần, không side effect ngoài localStorage.**
- [ ] **Step 4: `npm test` pass.**
- [ ] **Step 5: Commit** `feat(web): tien do, ghi chu va chung chi`.

---

### Task 9: Course UI cơ bản (3 tab, roadmap, nội dung, note, bài tập)

**Files:**
- Create: `frontend/src/components/ModeTabs.jsx`, `Course.jsx`, `Roadmap.jsx`, `LessonView.jsx`, `LessonContent.jsx`, `NotesPanel.jsx`, `ExercisePanel.jsx`, `QuizPanel.jsx`, `LessonResults.jsx`, `SqlEditor.jsx`, `FeedbackBox.jsx`
- Modify: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/index.css`
- Test: `LessonContent.test.jsx`, `NotesPanel.test.jsx`, `Course.test.jsx`

**Interfaces:**
- Consumes: `getCourse`, `getLesson`, `solveExercise`, `answerQuiz`, `getExerciseSolution`; `courseProgress`, `notes`.
- Produces: `Course({play})`; tab state `learn|do|result`; `NotesPanel({lessonId})`; `ExercisePanel({exercise, lessonId, onGraded, play})`; `LessonResults({lesson, progress, onNext, onReveal, play})`.

- [ ] **Step 1: Viết test thất bại** — `LessonContent` render p/code/list/callout, không render HTML thô; `NotesPanel` gõ → lưu → mount lại còn chữ; `Course` render roadmap 9 module từ mock, chuyển tab, nộp đúng hiện "Chính xác" và ghi progress.
- [ ] **Step 2: Chạy fail.**
- [ ] **Step 3: Implement components + `ApiError` handlers + CSS.**
- [ ] **Step 4: `npm test`, `npm run lint`, `npm run build` sạch.**
- [ ] **Step 5: Commit** `feat(web): khoa hoc 3 khu vuc va ghi chu`.

---

### Task 10: Tổng quan, thi cuối khóa, chứng chỉ

**Files:**
- Create: `CourseOverview.jsx`, `FinalExam.jsx`, `Certificate.jsx`
- Modify: `Course.jsx`, `App.jsx`, `index.css`
- Test: `CourseOverview.test.jsx`, `FinalExam.test.jsx`, `Certificate.test.jsx`

- [ ] **Step 1: Viết test thất bại** — overview pass/fail module; exam submit gọi API, hiện điểm/pass; certificate khóa khi thiếu điều kiện, mở khi đủ, hiện tên + mã, tải SVG (mock `URL.createObjectURL`).
- [ ] **Step 2: Chạy fail.**
- [ ] **Step 3: Implement + CSS in A4 ngang (`@media print`).**
- [ ] **Step 4: Test/lint/build sạch.**
- [ ] **Step 5: Commit** `feat(web): thi cuoi khoa va chung chi`.

---

### Task 11: Sandbox UI

**Files:**
- Create: `Sandbox.jsx`, `SchemaExplorer.jsx`
- Modify: `App.jsx`, `index.css`
- Test: `Sandbox.test.jsx`

- [ ] **Step 1: Viết test thất bại** — chạy SQL hiện bảng; lỗi hiện message; schema explorer mở bảng hiện cột.
- [ ] **Step 2: Chạy fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Test/lint/build sạch.**
- [ ] **Step 5: Commit** `feat(web): sandbox SQL chi doc`.

---

### Task 12: QA đầu-cuối + README + push

- [ ] **Step 1:** backend `npm test` (skip nếu DB tắt), frontend `npm test`, `lint`, `build`.
- [ ] **Step 2:** Tạo lại `shop` từ script trên DB sạch (drop/create) để chứng minh tái lập.
- [ ] **Step 3:** API smoke: 9 module/44 bài/53 bài tập/12 câu thi; solve solution → đúng; sandbox chặn ghi; reader không đọc `hocmysql`.
- [ ] **Step 4:** UI smoke: mở 3 chế độ, đi 1 bài đủ 3 tab, note reload, thi thử, chứng chỉ, in PDF, sandbox.
- [ ] **Step 5:** Cập nhật README (khóa học, 3 chế độ, tạo `shop`/reader, chứng chỉ cục bộ) + commit `docs: huong dan khoa hoc SQL`.
- [ ] **Step 6:** Review toàn nhánh bằng subagent, sửa Critical/Important, push `main`.

---

## Self-Review

- **Spec coverage:** 44 bài/9 module (Task 4–6), 53 bài tập + quiz (4–6), chấm kết quả (2, 7), sandbox/schema (3, 11), 3 tab + note (9), tiến độ/pass (8, 10), thi + chứng chỉ (7, 10), bảo mật reader (1, 2), QA (12).
- **Type consistency:** `Exercise` dùng chung `id/type/prompt/hints/solution|options/answer/explanation`; `compareResults` trả đúng `reason` mà `FeedbackBox` hiển thị; `summarize` trả đúng field Certificate dùng.
- **Review Focus tests:** cột sai thứ tự (Task 2), SQL độc hại (2, 3, 7), MySQL tắt (3, 7), note reload (9), chứng chỉ 79% (8, 10).
