import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCourse, getLesson } from '../api/client.js'
import {
  loadProgress,
  recordExam,
  recordExercise,
  saveProgress,
} from '../lib/courseProgress.js'
import Certificate from './Certificate.jsx'
import CourseOverview from './CourseOverview.jsx'
import FinalExam from './FinalExam.jsx'
import LessonView from './LessonView.jsx'
import Roadmap from './Roadmap.jsx'

const VIEWS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'exam', label: 'Bài thi' },
  { id: 'certificate', label: 'Chứng chỉ' },
]

export default function Course({ play }) {
  const [modules, setModules] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [view, setView] = useState('overview')
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

  const openLesson = useCallback((lessonId) => {
    setActiveLessonId(lessonId)
    setView('lesson')
  }, [])

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

  const handleExamSubmitted = useCallback((result) => {
    setProgress((current) => {
      const next = recordExam(current, { score: result.score })
      saveProgress(next)
      return next
    })
  }, [])

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
        activeLessonId={view === 'lesson' ? activeLessonId : null}
        onSelect={openLesson}
      />

      <section className="course-main">
        <nav className="course-nav" aria-label="Khu vực khóa học">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="course-nav-button"
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
          {view === 'lesson' && (
            <span className="course-nav-current">Đang học bài</span>
          )}
        </nav>

        {view === 'overview' && (
          <CourseOverview
            modules={modules}
            progress={progress}
            onOpenLesson={openLesson}
            onStartExam={() => setView('exam')}
            onOpenCertificate={() => setView('certificate')}
          />
        )}

        {view === 'exam' && <FinalExam play={play} onSubmitted={handleExamSubmitted} />}

        {view === 'certificate' && <Certificate course={modules} progress={progress} />}

        {view === 'lesson' && (
          <>
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
                onNext={nextLesson ? () => openLesson(nextLesson.id) : null}
                hasNext={Boolean(nextLesson)}
                play={play}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}
