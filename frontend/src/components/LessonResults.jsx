import { formatDateTime } from '../lib/format.js'

const RESULT_LABELS = {
  correct: 'Đạt',
  wrong: 'Chưa đạt',
}

export default function LessonResults({ lesson, progress, onNext, hasNext }) {
  const rows = lesson.exercises.map((exercise) => ({
    exercise,
    entry: progress.exercises[exercise.id] ?? null,
  }))
  const passedCount = rows.filter((row) => row.entry?.correct).length
  const passed = rows.length > 0 && passedCount === rows.length
  const attempts = rows.reduce((total, row) => total + (row.entry?.attempts ?? 0), 0)
  const hintsUsed = rows.reduce((total, row) => total + (row.entry?.hintsUsed ?? 0), 0)

  return (
    <section className="lesson-results">
      <header className="results-head">
        <p className="eyebrow">Kết quả bài học</p>
        <h3 className={passed ? 'is-pass' : 'is-pending'}>
          {passed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
        </h3>
        <p className="results-summary">
          {passedCount}/{rows.length} bài tập đạt · {attempts} lần thử · {hintsUsed} gợi ý đã dùng
        </p>
      </header>

      <ul className="results-list">
        {rows.map(({ exercise, entry }) => (
          <li key={exercise.id} className="results-item">
            <div className="results-item-head">
              <span className="results-item-title">{exercise.title}</span>
              <span className={`status-pill is-${entry?.correct ? 'ok' : 'pending'}`}>
                {entry?.correct ? RESULT_LABELS.correct : RESULT_LABELS.wrong}
              </span>
            </div>
            <p className="results-meta">
              {entry?.attempts ?? 0} lần thử
              {entry?.hintsUsed > 0 ? ` · ${entry.hintsUsed} gợi ý` : ''}
              {entry?.correct ? ' · +10 XP' : ''}
            </p>
            {entry?.history?.length > 0 && (
              <details className="history">
                <summary>Lịch sử {Math.min(entry.history.length, 10)} lần gần nhất</summary>
                <ul>
                  {entry.history
                    .slice(-10)
                    .reverse()
                    .map((item, index) => (
                      <li key={index}>
                        <span className={item.correct ? 'is-pass' : 'is-fail'}>
                          {item.correct ? 'Đúng' : 'Sai'}
                        </span>{' '}
                        · {formatDateTime(item.at)}
                        {item.sql ? ` · ${item.sql.slice(0, 80)}` : ''}
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>

      <footer className="results-foot">
        <span className="xp-badge">+{passedCount * 10} XP</span>
        {hasNext && (
          <button type="button" className="primary-button" onClick={onNext}>
            Bài tiếp theo
          </button>
        )}
      </footer>
    </section>
  )
}
