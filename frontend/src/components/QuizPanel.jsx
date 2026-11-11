import { useState } from 'react'
import { answerQuiz } from '../api/client.js'
import FeedbackBox from './FeedbackBox.jsx'

export default function QuizPanel({ exercise, progressEntry, onGraded, play }) {
  const [choice, setChoice] = useState(
    Number.isInteger(progressEntry?.lastChoice) ? progressEntry.lastChoice : null,
  )
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showSolution, setShowSolution] = useState(false)

  const submit = async () => {
    if (choice === null || status === 'loading') return

    setStatus('loading')
    setResult(null)
    setError(null)
    play?.('run')

    try {
      const data = await answerQuiz(exercise.id, choice)
      setResult(data)
      setStatus(data.correct ? 'correct' : 'wrong')
      play?.(data.correct ? 'success' : 'error')
      onGraded?.(exercise, { correct: data.correct, choice })
    } catch (failure) {
      setError(failure)
      setStatus('error')
      play?.('error')
      onGraded?.(exercise, { correct: false, choice })
    }
  }

  return (
    <article className="exercise">
      <header className="exercise-head">
        <p className="eyebrow">Quiz tổng kết</p>
        <h3>{exercise.title}</h3>
        <p className="exercise-prompt">{exercise.prompt}</p>
      </header>

      <fieldset className="quiz-options">
        <legend className="visually-hidden">Chọn một đáp án</legend>
        {exercise.options.map((option, index) => (
          <label key={index} className="quiz-option">
            <input
              type="radio"
              name={`quiz-${exercise.id}`}
              value={index}
              checked={choice === index}
              onChange={() => setChoice(index)}
              disabled={status === 'loading'}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      <div className="exercise-actions">
        <button
          type="button"
          className="primary-button"
          onClick={submit}
          disabled={choice === null || status === 'loading'}
        >
          {status === 'loading' ? 'Đang nộp…' : 'Nộp đáp án'}
        </button>
        {(status === 'wrong' || showSolution) && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowSolution((value) => !value)}
          >
            {showSolution ? 'Ẩn giải thích' : 'Xem giải thích'}
          </button>
        )}
      </div>

      <FeedbackBox
        status={status}
        result={result}
        error={error}
        explanation={result?.explanation}
      />
    </article>
  )
}
