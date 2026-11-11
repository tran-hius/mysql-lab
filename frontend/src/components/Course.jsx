import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCourse, getLesson } from '../api/client.js'
import { loadProgress, recordExercise, saveProgress } from '../lib/courseProgress.js'
import LessonView from './LessonView.jsx'
import Roadmap from './Roadmap.jsx'

export default function Course({ play }) {
  const [modules, setModules] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [lessonData, setLessonData] = useState(null)
  const [lessonError, setLessonError] = useState(null)
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    const controller = new AbortController()

    getCourse(controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return
        setModules(list)
        setActiveLessonId((current) => current ?? list[0]?.lessons?.[0]?.id ?? null)
      })
      .catch((failure) => {
        if (failure.name === 'AbortError') return
        setLoadError(failure)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!activeLessonId) return undefined

    const controller = new AbortController()

    getLesson(activeLessonId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setLessonData(data)
        setLessonError(null)
      })
      .catch((failure) => {
        if (failure.name === 'AbortError') return
        setLessonError({ lessonId: activeLessonId, error: failure })
      })

    return () => controller.abort()
  }, [activeLessonId])

  const lessonReady = lessonData?.lesson?.id === activeLessonId
  const currentLessonError =
    lessonError?.lessonId === activeLessonId ? lessonError.error : null

  const flatLessons = useMemo(
    () =>
      (modules ?? []).flatMap((module) =>
        module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
      ),
    [modules],
  )

  const currentIndex = flatLessons.findIndex((lesson) => lesson.id === activeLessonId)
  const nextLesson = currentIndex >= 0 ? flatLessons[currentIndex + 1] : null

  const handleGraded = useCallback(
    (exercise, submission) => {
      const lessonId = lessonData?.lesson?.id
      if (!lessonId) return

      setProgress((current) => {
        const next = recordExercise(current, {
          lessonId,
          exerciseId: exercise.id,
          correct: submission.correct,
          sql: submission.sql,
          choice: submission.choice,
          hintsUsed: submission.hintsUsed,
        })
        saveProgress(next)
        return next
      })
    },
    [lessonData],
  )

  if (loadError) {
    return (
      <main className="content">
        <section className="error-box" role="alert">
          <h2>Không tải được khóa học</h2>
          <p>{loadError.message}</p>
          {loadError.hint && <p className="hint">{loadError.hint}</p>}
          <button
            type="button"
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </section>
      </main>
    )
  }

  if (!modules) {
    return (
      <main className="content">
        <div className="loading" role="status" aria-busy="true">
          <span className="visually-hidden">Đang tải khóa học…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <span className="skeleton-row" key={index} aria-hidden="true" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="course">
      <Roadmap
        modules={modules}
        progress={progress}
        activeLessonId={activeLessonId}
        onSelect={setActiveLessonId}
      />

      <section className="course-main">
        {!currentLessonError && !lessonReady && (
          <p className="notice" role="status">
            Đang tải bài học…
          </p>
        )}

        {currentLessonError && (
          <div className="error-box" role="alert">
            <h2>Không tải được bài học</h2>
            <p>{currentLessonError.message}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setActiveLessonId((current) => current)}
            >
              Thử tải lại
            </button>
          </div>
        )}

        {lessonReady && (
          <LessonView
            key={lessonData.lesson.id}
            module={lessonData.module}
            lesson={lessonData.lesson}
            progress={progress}
            course={modules}
            onGraded={handleGraded}
            onNext={nextLesson ? () => setActiveLessonId(nextLesson.id) : null}
            hasNext={Boolean(nextLesson)}
            play={play}
          />
        )}
      </section>
    </main>
  )
}
