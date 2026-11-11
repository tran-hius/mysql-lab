import { useEffect, useState } from 'react'
import { getExam, submitExam } from '../api/client.js'
import { REASONS } from '../lib/feedback.js'
import SqlEditor from './SqlEditor.jsx'

function isAnswered(item, answer) {
  if (item.type === 'sql') return Boolean(answer?.sql?.trim())
  return Number.isInteger(answer?.choice)
}

export default function FinalExam({ play, onSubmitted }) {
  const [exam, setExam] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    getExam(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setExam(data)
      })
      .catch((failure) => {
        if (failure.name === 'AbortError') return
        setLoadError(failure)
      })

    return () => controller.abort()
  }, [])

  const items = exam?.items ?? []
  const answeredCount = items.filter((item) => isAnswered(item, answers[item.id])).length
  const complete = items.length > 0 && answeredCount === items.length

  const setSql = (id, sql) => {
    setAnswers((current) => ({ ...current, [id]: { ...current[id], sql } }))
  }

  const setChoice = (id, choice) => {
    setAnswers((current) => ({ ...current, [id]: { ...current[id], choice } }))
  }

  const submit = async () => {
    if (!complete || status === 'loading') return

    const payload = items.map((item) =>
      item.type === 'sql'
        ? { id: item.id, sql: answers[item.id]?.sql ?? '' }
        : { id: item.id, choice: answers[item.id]?.choice },
    )

    setStatus('loading')
    setError(null)
    play?.('run')

    try {
      const data = await submitExam(payload)
      setResult(data)
      setStatus('done')
      play?.(data.passed ? 'success' : 'error')
      onSubmitted?.(data)
    } catch (failure) {
      setError(failure)
      setStatus('error')
      play?.('error')
    }
  }

  const restart = () => {
    setAnswers({})
    setResult(null)
    setError(null)
    setStatus('idle')
  }

  if (loadError) {
    return (
      <section className="exam">
        <div className="error-box" role="alert">
          <h2>Không tải được bài thi</h2>
          <p>{loadError.message}</p>
          {loadError.hint && <p className="hint">{loadError.hint}</p>}
        </div>
      </section>
    )
  }

  if (!exam) {
    return (
      <section className="exam">
        <p className="notice" role="status">
          Đang tải bài thi…
        </p>
      </section>
    )
  }

  const locked = status === 'loading' || status === 'done'

  return (
    <section className="exam">
      <header className="exam-head">
        <p className="eyebrow">Kiểm tra cuối khóa</p>
        <h2>{exam.title}</h2>
        <p className="exam-lead">
          {items.length} câu gồm {items.filter((item) => item.type === 'sql').length} SQL và{' '}
          {items.filter((item) => item.type === 'quiz').length} quiz. Đạt khi ≥ {exam.passScore}/100.
          Đã trả lời {answeredCount}/{items.length} câu.
        </p>
      </header>

      {result && (
        <div className={`exam-result ${result.passed ? 'is-pass' : 'is-fail'}`}>
          <p className="exam-score">{result.score}/100</p>
          <p className="exam-verdict">
            <span className="exam-verdict-word">{result.passed ? 'Đạt' : 'Chưa đạt'}</span> · đúng{' '}
            {result.correctCount}/{result.total} câu
          </p>
          <button type="button" className="primary-button" onClick={restart}>
            Làm lại
          </button>
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          <h2>Không nộp được bài thi</h2>
          <p>{error.message}</p>
          {error.hint && <p className="hint">{error.hint}</p>}
        </div>
      )}

      <ol className="exam-items">
        {items.map((item, index) => {
          const answer = answers[item.id] ?? {}
          const itemResult = result?.items?.find((entry) => entry.id === item.id)

          return (
            <li key={item.id} className="exam-item">
              <header className="exam-item-head">
                <span className="exam-item-number">Câu {index + 1}</span>
                <span className={`status-pill ${itemResult?.correct ? 'is-ok' : 'is-pending'}`}>
                  {item.type === 'sql' ? 'SQL' : 'Quiz'}
                </span>
              </header>
              <h3>{item.title}</h3>
              <p className="exercise-prompt">{item.prompt}</p>

              {item.type === 'sql' ? (
                <>
                  <p className="exercise-columns">
                    Cột kết quả: <code>{item.outputColumns.join(', ')}</code>
                  </p>
                  <SqlEditor
                    id={`exam-${item.id}`}
                    label={`SQL câu ${index + 1}`}
                    hint="So khớp kết quả với đáp án, không cần đúng định dạng câu lệnh."
                    value={answer.sql ?? ''}
                    onChange={(value) => setSql(item.id, value)}
                    onRun={submit}
                    disabled={locked}
                  />
                </>
              ) : (
                <fieldset className="quiz-options">
                  <legend className="visually-hidden">Chọn một đáp án</legend>
                  {item.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="quiz-option">
                      <input
                        type="radio"
                        name={`exam-${item.id}`}
                        value={optionIndex}
                        checked={answer.choice === optionIndex}
                        onChange={() => setChoice(item.id, optionIndex)}
                        disabled={locked}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              {itemResult && (
                <div className={`feedback ${itemResult.correct ? 'is-correct' : 'is-wrong'}`}>
                  <p className="feedback-title">{itemResult.correct ? 'Đúng' : 'Sai'}</p>
                  {!itemResult.correct && itemResult.feedback?.reason && (
                    <p>{REASONS[itemResult.feedback.reason] ?? 'Kết quả chưa khớp đáp án.'}</p>
                  )}
                  {!itemResult.correct && itemResult.feedback?.message && (
                    <p className="feedback-detail">{itemResult.feedback.message}</p>
                  )}
                  {itemResult.explanation && (
                    <p className="feedback-detail">{itemResult.explanation}</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="exam-actions">
        <button
          type="button"
          className="primary-button"
          onClick={submit}
          disabled={!complete || status === 'loading' || status === 'done'}
        >
          {status === 'loading' ? 'Đang chấm…' : 'Nộp bài'}
        </button>
        {!complete && status !== 'done' && (
          <p className="results-meta">
            Còn {items.length - answeredCount} câu chưa trả lời.
          </p>
        )}
      </div>
    </section>
  )
}
