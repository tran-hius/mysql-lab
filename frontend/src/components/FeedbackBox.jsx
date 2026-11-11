import { REASONS } from '../lib/feedback.js'

export default function FeedbackBox({ status, result, error, explanation }) {
  if (status === 'correct') {
    return (
      <div className="feedback is-correct" role="status">
        <p className="feedback-title">Chính xác</p>
        <p>Kết quả khớp với đáp án.</p>
        {explanation && <p className="feedback-detail">{explanation}</p>}
      </div>
    )
  }

  if (status === 'wrong' && result) {
    const { feedback } = result

    return (
      <div className="feedback is-wrong" role="alert">
        <p className="feedback-title">Chưa đúng</p>
        <p>{REASONS[feedback?.reason] ?? 'Kết quả chưa khớp đáp án.'}</p>
        {feedback?.reason === 'ORDER' && (
          <p className="feedback-detail">
            Dòng {feedback.actualRowCount} / {feedback.expectedRowCount}. Kiểm tra ORDER BY và
            tie-breaker.
          </p>
        )}
        {feedback?.reason === 'ROW_COUNT' && (
          <p className="feedback-detail">
            Đáp án có {feedback.expectedRowCount} dòng, bạn trả về {feedback.actualRowCount} dòng
            (thiếu {feedback.missingCount}, thừa {feedback.extraCount}).
          </p>
        )}
        {explanation && <p className="feedback-detail">{explanation}</p>}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="feedback is-error" role="alert">
        <p className="feedback-title">Không chấm được</p>
        <p>{error?.message ?? 'Đã có lỗi khi chấm bài.'}</p>
        {error?.hint && <p className="feedback-detail">{error.hint}</p>}
      </div>
    )
  }

  return null
}
