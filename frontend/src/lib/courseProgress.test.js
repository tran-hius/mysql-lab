import { beforeEach, describe, expect, it } from 'vitest'
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  recordExercise,
  recordSolutionView,
  recordExam,
  isLessonPassed,
  summarize,
  computeStreak,
} from './courseProgress.js'

const course = [
  {
    id: 'm1',
    title: 'Module 1',
    lessons: [
      { id: 'm1-l1', title: 'Bài 1', exerciseCount: 1 },
      { id: 'm1-l2', title: 'Bài 2', exerciseCount: 2 },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2',
    lessons: [{ id: 'm2-l1', title: 'Bài 3', exerciseCount: 1 }],
  },
]

const at = (iso) => new Date(iso)

beforeEach(() => {
  localStorage.clear()
})

describe('lưu trữ tiến độ', () => {
  it('lưu và đọc lại đúng dữ liệu', () => {
    const progress = recordExercise(emptyProgress(), {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: true,
      sql: 'SELECT 1',
      at: at('2026-11-11T10:00:00'),
    })

    saveProgress(progress)
    const loaded = loadProgress()

    expect(loaded.exercises['m1-l1-ex1'].correct).toBe(true)
    expect(loaded.exercises['m1-l1-ex1'].attempts).toBe(1)
    expect(loaded.activityDays.length).toBe(1)
  })

  it('dữ liệu hỏng trả tiến độ rỗng', () => {
    localStorage.setItem('mysql-lab:course', '{khong-phai-json')
    expect(loadProgress()).toEqual(emptyProgress())
  })
})

describe('recordExercise và XP', () => {
  it('XP chỉ cộng lần đúng đầu tiên', () => {
    let progress = emptyProgress()

    progress = recordExercise(progress, {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: true,
      sql: 'SELECT 1',
      at: at('2026-11-11T10:00:00'),
    })

    let summary = summarize(course, progress)
    expect(summary.exercisesPassed).toBe(1)
    expect(summary.xp).toBe(10)

    progress = recordExercise(progress, {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: true,
      sql: 'SELECT 1',
      at: at('2026-11-11T10:05:00'),
    })

    summary = summarize(course, progress)
    expect(summary.xp).toBe(10)
    expect(progress.exercises['m1-l1-ex1'].attempts).toBe(2)
    expect(progress.exercises['m1-l1-ex1'].history).toHaveLength(2)
  })

  it('sai không làm mất trạng thái đã pass trước đó', () => {
    let progress = recordExercise(emptyProgress(), {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: true,
    })
    progress = recordExercise(progress, {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: false,
    })

    expect(progress.exercises['m1-l1-ex1'].correct).toBe(true)
    expect(progress.exercises['m1-l1-ex1'].lastCorrect).toBe(false)
  })

  it('xem đáp án ghi cờ viewedSolution mà không tăng attempts', () => {
    let progress = recordExercise(emptyProgress(), {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
      correct: false,
    })
    progress = recordSolutionView(progress, {
      lessonId: 'm1-l1',
      exerciseId: 'm1-l1-ex1',
    })

    expect(progress.exercises['m1-l1-ex1'].viewedSolution).toBe(true)
    expect(progress.exercises['m1-l1-ex1'].attempts).toBe(1)
    expect(progress.activityDays).toHaveLength(0)
  })
})

describe('pass rules', () => {
  it('bài chỉ pass khi mọi bài tập đúng', () => {
    let progress = recordExercise(emptyProgress(), {
      lessonId: 'm1-l2',
      exerciseId: 'm1-l2-ex1',
      correct: true,
    })

    expect(isLessonPassed(progress, course[0].lessons[1])).toBe(false)

    progress = recordExercise(progress, {
      lessonId: 'm1-l2',
      exerciseId: 'm1-l2-ex2',
      correct: true,
    })

    expect(isLessonPassed(progress, course[0].lessons[1])).toBe(true)
  })

  it('module pass khi mọi bài pass; coursePassed khi mọi module pass', () => {
    let progress = emptyProgress()
    for (const exerciseId of ['m1-l1-ex1', 'm1-l2-ex1', 'm1-l2-ex2']) {
      const lessonId = exerciseId.startsWith('m1-l1') ? 'm1-l1' : 'm1-l2'
      progress = recordExercise(progress, { lessonId, exerciseId, correct: true })
    }

    let summary = summarize(course, progress)
    expect(summary.modules[0].passed).toBe(true)
    expect(summary.coursePassed).toBe(false)

    progress = recordExercise(progress, {
      lessonId: 'm2-l1',
      exerciseId: 'm2-l1-ex1',
      correct: true,
    })
    summary = summarize(course, progress)

    expect(summary.coursePassed).toBe(true)
    expect(summary.lessonsPassed).toBe(3)
    expect(summary.exercisesPassed).toBe(4)
  })
})

describe('exam và streak', () => {
  it('giữ điểm thi cao nhất và passed >= 80', () => {
    let progress = recordExam(emptyProgress(), { score: 75 })
    expect(progress.exam).toMatchObject({ bestScore: 75, passed: false, attempts: 1 })

    progress = recordExam(progress, { score: 83 })
    expect(progress.exam).toMatchObject({ bestScore: 83, passed: true, attempts: 2 })

    progress = recordExam(progress, { score: 70 })
    expect(progress.exam).toMatchObject({ bestScore: 83, passed: true, attempts: 3 })
  })

  it('streak đếm các ngày hoạt động liên tiếp', () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    let progress = emptyProgress()
    for (const [index, day] of [twoDaysAgo, yesterday, today].entries()) {
      progress = recordExercise(progress, {
        lessonId: 'm1-l1',
        exerciseId: `m1-l1-ex${index}`,
        correct: true,
        at: day,
      })
    }

    expect(summarize(course, progress).streak).toBe(3)
    expect(computeStreak(progress.activityDays, today)).toBe(3)
  })
})
