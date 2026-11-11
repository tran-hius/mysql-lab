import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allModules,
  listCourse,
  getLesson,
  findExercise,
  validateCourse,
} from '../src/course/index.js'
import { runPracticeSql } from '../src/services/practiceRunner.js'
import { readerPool } from '../src/config/readerPool.js'

test.after(async () => {
  await readerPool.end()
})

test('cấu trúc khóa học hợp lệ', () => {
  const errors = validateCourse()
  assert.equal(errors.length, 0, errors.join('\n'))

  assert.equal(allModules.length, 5)
  const lessons = allModules.flatMap((module) => module.lessons)
  assert.equal(lessons.length, 26)

  for (const lesson of lessons) {
    assert.ok(lesson.blocks.length >= 4, `${lesson.id} phải có ít nhất 4 block`)
    assert.ok(lesson.exercises.length >= 1, `${lesson.id} phải có bài tập`)
  }

  for (const module of allModules) {
    const lastLesson = module.lessons.at(-1)
    assert.ok(
      lastLesson.exercises.some((exercise) => exercise.type === 'quiz'),
      `${module.id} phải có quiz ở bài cuối`,
    )
  }
})

test('listCourse không lộ nội dung, đề bài hay đáp án', () => {
  const course = listCourse()
  const serialized = JSON.stringify(course)

  assert.equal(course.length, allModules.length)
  assert.equal(course[0].lessons.length, allModules[0].lessons.length)
  assert.equal(serialized.includes('solution'), false)
  assert.equal(serialized.includes('prompt'), false)
  assert.equal(serialized.includes('blocks'), false)
  assert.ok(course[0].lessons[0].exerciseCount >= 1)
})

test('getLesson và findExercise tra cứu đúng, trả null khi không có', () => {
  const found = getLesson('m1-l1')
  assert.equal(found.lesson.id, 'm1-l1')
  assert.equal(found.module.id, 'm1')

  const exercise = findExercise('m1-l1-ex1')
  assert.equal(exercise.exercise.id, 'm1-l1-ex1')
  assert.equal(exercise.lesson.id, 'm1-l1')

  assert.equal(getLesson('khong-ton-tai'), null)
  assert.equal(findExercise('khong-ton-tai'), null)
})

test('mọi solution chạy được trên shop và khớp số cột', async () => {
  for (const module of allModules) {
    for (const lesson of module.lessons) {
      for (const exercise of lesson.exercises) {
        if (exercise.type !== 'sql') continue

        const result = await runPracticeSql(exercise.solution)
        assert.ok(result.rowCount > 0, `${exercise.id} không trả dòng nào`)
        assert.equal(
          result.columns.length,
          exercise.outputColumns.length,
          `${exercise.id} lệch số cột`,
        )
      }
    }
  }
})
