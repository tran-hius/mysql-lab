const STORAGE_KEY = 'mysql-lab:course'
const XP_PER_EXERCISE = 10
const MAX_HISTORY = 10

export const PASS_SCORE = 80

export function emptyProgress() {
  return {
    version: 1,
    exercises: {},
    activityDays: [],
    exam: { bestScore: 0, passed: false, attempts: 0, lastAt: null },
  }
}

function normalize(progress) {
  return {
    version: 1,
    exercises:
      progress?.exercises && typeof progress.exercises === 'object' ? progress.exercises : {},
    activityDays: Array.isArray(progress?.activityDays) ? progress.activityDays : [],
    exam:
      progress?.exam && typeof progress.exam === 'object'
        ? progress.exam
        : emptyProgress().exam,
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    return normalize(JSON.parse(raw))
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(progress)))
  } catch {
    // localStorage đầy hoặc bị chặn: tiến độ vẫn dùng được trong phiên hiện tại.
  }
  return progress
}

export function dayKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDay(days, key) {
  if (days.includes(key)) return days
  return [...days, key].sort()
}

export function recordExercise(
  progress,
  { lessonId, exerciseId, correct, sql, choice, hintsUsed = 0, at = new Date() },
) {
  const base = normalize(progress)
  const previous = base.exercises[exerciseId] ?? {}
  const correctNow = Boolean(correct)
  const timestamp = at.toISOString()
  const history = [
    ...(previous.history ?? []),
    {
      at: timestamp,
      correct: correctNow,
      sql: sql ? String(sql).slice(0, 300) : null,
    },
  ].slice(-MAX_HISTORY)

  const entry = {
    ...previous,
    lessonId,
    attempts: (previous.attempts ?? 0) + 1,
    correct: Boolean(previous.correct) || correctNow,
    lastCorrect: correctNow,
    lastAt: timestamp,
    firstCorrectAt: previous.firstCorrectAt ?? (correctNow ? timestamp : null),
    lastSql: sql ? String(sql).slice(0, 500) : (previous.lastSql ?? null),
    lastChoice: Number.isInteger(choice) ? choice : (previous.lastChoice ?? null),
    hintsUsed: Math.max(previous.hintsUsed ?? 0, hintsUsed),
    history,
  }

  return {
    ...base,
    exercises: { ...base.exercises, [exerciseId]: entry },
    activityDays: addDay(base.activityDays, dayKey(at)),
  }
}

export function recordExam(progress, { score, at = new Date() }) {
  const base = normalize(progress)
  const previous = base.exam
  const safeScore = Number(score) || 0
  const bestScore = Math.max(previous.bestScore ?? 0, safeScore)

  return {
    ...base,
    exam: {
      bestScore,
      passed: bestScore >= PASS_SCORE,
      attempts: (previous.attempts ?? 0) + 1,
      lastAt: at.toISOString(),
      lastScore: safeScore,
    },
    activityDays: addDay(base.activityDays, dayKey(at)),
  }
}

export function isLessonPassed(progress, lesson) {
  if (!lesson) return false
  const data = normalize(progress)

  if (Array.isArray(lesson.exercises)) {
    return (
      lesson.exercises.length > 0 &&
      lesson.exercises.every((exercise) => data.exercises[exercise.id]?.correct)
    )
  }

  const expected = lesson.exerciseCount ?? 0
  if (expected <= 0) return false

  const passed = Object.values(data.exercises).filter(
    (entry) => entry.lessonId === lesson.id && entry.correct,
  ).length

  return passed >= expected
}

export function computeStreak(days, now = new Date()) {
  const set = new Set(days)
  if (set.size === 0) return 0

  const cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)

  if (!set.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (set.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function summarize(course, progress) {
  const modules = Array.isArray(course) ? course : (course?.modules ?? [])
  const data = normalize(progress)
  const exercisesPassed = Object.values(data.exercises).filter((entry) => entry.correct).length

  const moduleSummaries = modules.map((module) => {
    const lessons = module.lessons ?? []
    const lessonsPassed = lessons.filter((lesson) => isLessonPassed(data, lesson)).length

    return {
      id: module.id,
      title: module.title,
      passed: lessons.length > 0 && lessonsPassed === lessons.length,
      lessonsPassed,
      lessonsTotal: lessons.length,
    }
  })

  const exercisesTotal = modules.reduce(
    (total, module) =>
      total +
      (module.lessons ?? []).reduce(
        (sum, lesson) => sum + (lesson.exerciseCount ?? lesson.exercises?.length ?? 0),
        0,
      ),
    0,
  )

  return {
    lessonsPassed: moduleSummaries.reduce((total, module) => total + module.lessonsPassed, 0),
    lessonsTotal: moduleSummaries.reduce((total, module) => total + module.lessonsTotal, 0),
    exercisesPassed,
    exercisesTotal,
    xp: exercisesPassed * XP_PER_EXERCISE,
    streak: computeStreak(data.activityDays),
    modules: moduleSummaries,
    coursePassed: moduleSummaries.length > 0 && moduleSummaries.every((module) => module.passed),
  }
}
