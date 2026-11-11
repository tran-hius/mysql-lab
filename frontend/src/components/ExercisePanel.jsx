import { useState } from 'react'
import { getExerciseSolution, solveExercise } from '../api/client.js'
import FeedbackBox from './FeedbackBox.jsx'
import ResultTable from './ResultTable.jsx'
import SqlEditor from './SqlEditor.jsx'

export default function ExercisePanel({ exercise, progressEntry, onGraded, play }) {
  const [sql, setSql] = useState(progressEntry?.lastSql ?? '')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [hintCount, setHintCount] = useState(progressEntry?.hintsUsed ?? 0)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const [solution, setSolution] = useState(null)

  const busy = status === 'loading'

  const run = async () => {
    if (!sql.trim() || busy) return

    setStatus('loading')
    setResult(null)
    setError(null)
    play?.('run')

    try {
      const data = await solveExercise(exercise.id, sql)
      setResult(data)
      setStatus(data.correct ? 'correct' : 'wrong')
      play?.(data.correct ? 'success' : 'error')
      onGraded?.(exercise, { correct: data.correct, sql, hintsUsed: hintCount })
    } catch (failure) {
      setError(failure)
      setStatus('error')
      play?.('error')
      onGraded?.(exercise, { correct: false, sql, hintsUsed: hintCount })
    }
  }

  const reveal = async () => {
    if (!confirmReveal) {
      setConfirmReveal(true)
      return
    }

    try {
      setConfirmReveal(false)
      setSolution(await getExerciseSolution(exercise.id))
    } catch (failure) {
      setError(failure)
      setStatus('error')
    }
  }

  return (
    <article className="exercise">
      <header className="exercise-head">
        <p className="eyebrow">Bài tập SQL</p>
        <h3>{exercise.title}</h3>
        <p className="exercise-prompt">{exercise.prompt}</p>
        {exercise.outputColumns?.length > 0 && (
          <p className="exercise-columns">
            Cột đầu ra: <code>{exercise.outputColumns.join(', ')}</code>
          </p>
        )}
      </header>

      <SqlEditor value={sql} onChange={setSql} onRun={run} disabled={busy} />

      <div className="exercise-actions">
        <button type="button" className="primary-button" onClick={run} disabled={busy || !sql.trim()}>
          {busy ? 'Đang chấm…' : 'Chạy & chấm'}
        </button>
        {hintCount < (exercise.hints?.length ?? 0) && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => setHintCount((count) => Math.min(count + 1, exercise.hints.length))}
          >
            Mở gợi ý ({hintCount}/{exercise.hints.length})
          </button>
        )}
        <button type="button" className="ghost-button" onClick={reveal}>
          {confirmReveal ? 'Bấm lần nữa để xem đáp án' : 'Xem đáp án'}
        </button>
      </div>

      {hintCount > 0 && (
        <ol className="hint-list">
          {exercise.hints.slice(0, hintCount).map((hint, index) => (
            <li key={index}>{hint}</li>
          ))}
        </ol>
      )}

      <FeedbackBox status={status} result={result} error={error} />

      {status === 'wrong' && result?.user?.rows?.length > 0 && (
        <details className="user-result">
          <summary>Kết quả bạn vừa trả về ({result.user.rows.length} dòng)</summary>
          <ResultTable columns={result.user.columns} rows={result.user.rows} />
        </details>
      )}

      {solution?.type === 'sql' && (
        <div className="solution-box">
          <p className="field-label">Đáp án tham khảo</p>
          <pre className="lesson-code">
            <code>{solution.sql}</code>
          </pre>
          {solution.result?.rows?.length > 0 && (
            <ResultTable columns={solution.result.columns} rows={solution.result.rows} />
          )}
        </div>
      )}
    </article>
  )
}
