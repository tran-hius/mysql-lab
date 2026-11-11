import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'
import { readerPool } from '../src/config/readerPool.js'
import { examItems } from '../src/course/index.js'

let server
let baseUrl

test.before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await readerPool.end()
})

const post = (path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

test('GET /api/course trả 9 module, 44 bài, không lộ nội dung', async () => {
  const response = await fetch(`${baseUrl}/api/course`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.modules.length, 9)
  assert.equal(
    body.modules.reduce((total, module) => total + module.lessons.length, 0),
    44,
  )
  const serialized = JSON.stringify(body)
  assert.equal(serialized.includes('solution'), false)
  assert.equal(serialized.includes('prompt'), false)
  assert.equal(serialized.includes('blocks'), false)
})

test('GET lesson trả nội dung và bài tập nhưng ẩn đáp án', async () => {
  const response = await fetch(`${baseUrl}/api/course/lessons/m1-l1`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.lesson.id, 'm1-l1')
  assert.ok(body.lesson.blocks.length >= 4)

  const exercise = body.lesson.exercises[0]
  assert.equal(exercise.type, 'sql')
  assert.equal(exercise.solution, undefined)
  assert.equal(exercise.hints.length, 3)

  const quizResponse = await fetch(`${baseUrl}/api/course/lessons/m1-l5`)
  const quizBody = await quizResponse.json()
  const quiz = quizBody.lesson.exercises.find((item) => item.type === 'quiz')
  assert.ok(quiz)
  assert.equal(quiz.answer, undefined)
  assert.equal(quiz.explanation, undefined)

  const missing = await fetch(`${baseUrl}/api/course/lessons/khong-ton-tai`)
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error, 'LESSON_NOT_FOUND')
})

test('POST solve đúng trả correct và feedback rỗng', async () => {
  const response = await post('/api/course/exercises/m1-l1-ex1/solve', {
    sql: "SELECT name AS product_name, price, ROUND(price * 0.9, 2) AS discounted_price FROM products WHERE category = 'Tablet' ORDER BY id",
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.correct, true)
  assert.equal(body.feedback.reason, null)
  assert.equal(body.expectedRowCount, 2)
  assert.equal(body.user.rows.length, 2)
  assert.equal(body.user.columns.length, 3)
})

test('POST solve sai trả correct false kèm lý do', async () => {
  const response = await post('/api/course/exercises/m1-l1-ex1/solve', {
    sql: 'SELECT id FROM products ORDER BY id LIMIT 2',
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.correct, false)
  assert.ok(body.feedback.reason)
  assert.ok(body.feedback.expectedRowCount > 0)
  assert.ok(body.user)
})

test('POST solve chặn SQL ghi và SQL lỗi', async () => {
  const blocked = await post('/api/course/exercises/m1-l1-ex1/solve', {
    sql: 'DELETE FROM products',
  })
  assert.equal(blocked.status, 400)
  assert.equal((await blocked.json()).error, 'SQL_NOT_ALLOWED')

  const broken = await post('/api/course/exercises/m1-l1-ex1/solve', {
    sql: 'SELECT khong_ton_tai FROM products',
  })
  assert.equal(broken.status, 422)
  assert.equal((await broken.json()).error, 'SQL_ERROR')

  const missing = await post('/api/course/exercises/khong-ton-tai/solve', {
    sql: 'SELECT 1',
  })
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error, 'EXERCISE_NOT_FOUND')
})

test('POST answer chấm quiz và từ chối choice không hợp lệ', async () => {
  const correct = await post('/api/course/exercises/m1-quiz/answer', { choice: 1 })
  const correctBody = await correct.json()
  assert.equal(correct.status, 200)
  assert.equal(correctBody.correct, true)
  assert.ok(correctBody.explanation)

  const wrong = await post('/api/course/exercises/m1-quiz/answer', { choice: 0 })
  assert.equal((await wrong.json()).correct, false)

  const invalid = await post('/api/course/exercises/m1-quiz/answer', { choice: 9 })
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).error, 'INVALID_CHOICE')
})

test('GET solution trả đáp án SQL kèm kết quả mẫu, quiz trả đáp án', async () => {
  const sqlResponse = await fetch(`${baseUrl}/api/course/exercises/m1-l1-ex1/solution`)
  const sqlBody = await sqlResponse.json()

  assert.equal(sqlResponse.status, 200)
  assert.equal(sqlBody.type, 'sql')
  assert.match(sqlBody.sql, /^SELECT/i)
  assert.equal(sqlBody.result.columns.length, 3)
  assert.ok(sqlBody.result.rows.length >= 1)

  const quizResponse = await fetch(`${baseUrl}/api/course/exercises/m1-quiz/solution`)
  const quizBody = await quizResponse.json()

  assert.equal(quizResponse.status, 200)
  assert.equal(quizBody.type, 'quiz')
  assert.equal(quizBody.answer, 1)
  assert.ok(quizBody.explanation)
})

test('GET exam trả 12 câu không lộ đáp án', async () => {
  const response = await fetch(`${baseUrl}/api/course/exam`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.items.length, 12)
  assert.equal(body.passScore, 80)
  for (const item of body.items) {
    assert.equal(item.solution, undefined)
    assert.equal(item.answer, undefined)
    assert.equal(item.explanation, undefined)
  }
})

test('POST exam submit đúng hết đạt 100 và passed', async () => {
  const items = examItems.map((item) =>
    item.type === 'sql'
      ? { id: item.id, sql: item.solution }
      : { id: item.id, choice: item.answer },
  )
  const response = await post('/api/course/exam/submit', { items })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.score, 100)
  assert.equal(body.passed, true)
  assert.equal(body.items.length, 12)
  assert.ok(body.items.every((item) => item.correct))
})

test('POST exam submit sai quiz không đạt 80', async () => {
  const items = examItems.map((item) =>
    item.type === 'sql'
      ? { id: item.id, sql: item.solution }
      : { id: item.id, choice: (item.answer + 1) % 4 },
  )
  const response = await post('/api/course/exam/submit', { items })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.score, 67)
  assert.equal(body.passed, false)
  assert.equal(body.items.filter((item) => item.correct).length, 8)
})

test('POST exam submit thiếu câu trả 422', async () => {
  const response = await post('/api/course/exam/submit', {
    items: [{ id: examItems[0].id, sql: examItems[0].solution }],
  })
  const body = await response.json()

  assert.equal(response.status, 422)
  assert.equal(body.error, 'INCOMPLETE_EXAM')
})
