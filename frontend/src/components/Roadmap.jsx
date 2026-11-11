import { isLessonPassed, summarize } from '../lib/courseProgress.js'

export default function Roadmap({ modules, progress, activeLessonId, onSelect }) {
  const summary = summarize(modules, progress)
  const percent =
    summary.lessonsTotal > 0
      ? Math.round((summary.lessonsPassed / summary.lessonsTotal) * 100)
      : 0

  return (
    <aside className="roadmap" aria-label="Lộ trình khóa học">
      <div className="roadmap-head">
        <p className="eyebrow">Lộ trình 44 bài</p>
        <p className="roadmap-progress">
          {summary.lessonsPassed}/{summary.lessonsTotal} bài · {summary.xp} XP · chuỗi{' '}
          {summary.streak} ngày
        </p>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {modules.map((module) => {
        const moduleSummary = summary.modules.find((item) => item.id === module.id)

        return (
          <section key={module.id} className="roadmap-module">
            <h3 className="roadmap-module-title">
              <span>{module.title}</span>
              <span className={`module-count ${moduleSummary?.passed ? 'is-pass' : ''}`}>
                {moduleSummary?.lessonsPassed ?? 0}/{moduleSummary?.lessonsTotal ?? 0}
              </span>
            </h3>
            <ul className="roadmap-lessons">
              {module.lessons.map((lesson) => {
                const passed = isLessonPassed(progress, lesson)

                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className="roadmap-lesson"
                      aria-current={activeLessonId === lesson.id}
                      data-passed={passed ? 'true' : 'false'}
                      onClick={() => onSelect(lesson.id)}
                    >
                      <span className={`lesson-dot ${passed ? 'is-pass' : ''}`} aria-hidden="true">
                        {passed ? '✓' : ''}
                      </span>
                      <span>{lesson.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </aside>
  )
}
