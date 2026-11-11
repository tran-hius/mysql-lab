import test from 'node:test'
import assert from 'node:assert/strict'
import { allModules, validateCourse, getExam, examItems } from '../src/course/index.js'
import { runPracticeSql } from '../src/services/practiceRunner.js'
import { readerPool } from '../src/config/readerPool.js'

test.after(async () => {
  await readerPool.end()
})

test('khóa học đủ 9 module, 44 bài, 53 bài tập', () => {
  assert.equal(allModules.length, 9)
  assert.equal(validateCourse().length, 0, validateCourse().join('\n'))

  const lessons = allModules.flatMap((module) => module.lessons)
  assert.equal(lessons.length, 44)
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 44)

  const exercises = lessons.flatMap((lesson) => lesson.exercises)
  assert.equal(exercises.length, 53)
  assert.equal(exercises.filter((exercise) => exercise.type === 'sql').length, 44)
  assert.equal(exercises.filter((exercise) => exercise.type === 'quiz').length, 9)
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 53)
})

test('đề thi đủ 12 câu, 8 SQL + 4 quiz, phủ 9 module và không lộ đáp án', () => {
  const exam = getExam()

  assert.equal(exam.passScore, 80)
  assert.equal(exam.items.length, 12)
  assert.equal(exam.items.filter((item) => item.type === 'sql').length, 8)
  assert.equal(exam.items.filter((item) => item.type === 'quiz').length, 4)
  assert.equal(new Set(examItems.map((item) => item.moduleId)).size, 9)

  for (const item of exam.items) {
    assert.equal(item.solution, undefined, `${item.id} lộ solution`)
    assert.equal(item.answer, undefined, `${item.id} lộ answer`)
    assert.equal(item.explanation, undefined, `${item.id} lộ explanation`)
  }
})

test('mọi solution đề thi chạy được và khớp số cột', async () => {
  for (const item of examItems) {
    if (item.type !== 'sql') continue
    const result = await runPracticeSql(item.solution)
    assert.ok(result.rowCount > 0, `${item.id} không trả dòng nào`)
    assert.equal(result.columns.length, item.outputColumns.length, `${item.id} lệch số cột`)
  }
})
