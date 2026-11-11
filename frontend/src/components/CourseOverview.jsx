import { canIssue } from '../lib/certificate.js'
import { isLessonPassed, PASS_SCORE, summarize } from '../lib/courseProgress.js'

export default function CourseOverview({
  modules,
  progress,
  onOpenLesson,
  onStartExam,
  onOpenCertificate,
}) {
  const summary = summarize(modules, progress)
  const eligibility = canIssue(progress, modules)
  const percent =
    summary.lessonsTotal > 0
      ? Math.round((summary.lessonsPassed / summary.lessonsTotal) * 100)
      : 0
  const bestScore = progress?.exam?.bestScore ?? 0
  const firstUnpassed = (modules ?? [])
    .flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })))
    .find((lesson) => !isLessonPassed(progress, lesson))

  return (
    <section className="overview">
      <header className="overview-head">
        <p className="eyebrow">Khóa học</p>
        <h1>SQL Thực Chiến cho Data</h1>
        <p className="overview-lead">
          44 bài, 53 bài tập và một bài thi cuối khóa. Đi từ nền tảng SQL đến analytics sản phẩm,
          hiệu năng và pipeline DE/ML.
        </p>
      </header>

      <div className="overview-stats">
        <div className="stat-card">
          <span className="stat-value">
            {summary.lessonsPassed}/{summary.lessonsTotal} bài
          </span>
          <span className="stat-label">Bài đã pass</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{percent}%</span>
          <span className="stat-label">Hoàn thành khóa</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{bestScore}/100</span>
          <span className="stat-label">Điểm thi cao nhất</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.xp} XP</span>
          <span className="stat-label">Chuỗi {summary.streak} ngày</span>
        </div>
      </div>

      <h2 className="overview-section-title">9 module</h2>
      <ul className="overview-modules">
        {summary.modules.map((module) => {
          const modulePercent =
            module.lessonsTotal > 0
              ? Math.round((module.lessonsPassed / module.lessonsTotal) * 100)
              : 0

          return (
            <li
              key={module.id}
              data-testid={`overview-${module.id}`}
              data-passed={module.passed ? 'true' : 'false'}
              className="overview-module"
            >
              <div className="overview-module-head">
                <span className="overview-module-title">{module.title}</span>
                <span className={`status-pill ${module.passed ? 'is-ok' : 'is-pending'}`}>
                  {module.passed ? 'Đạt' : 'Chưa đạt'}
                </span>
              </div>
              <p className="results-meta">
                {module.lessonsPassed}/{module.lessonsTotal} bài
              </p>
              <div className="progress-track">
                <span className="progress-fill" style={{ width: `${modulePercent}%` }} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="overview-actions">
        <section className="overview-card">
          <h2>Bài thi cuối khóa</h2>
          <p>
            12 câu (8 SQL + 4 quiz), đạt khi ≥ {PASS_SCORE}/100. Điểm cao nhất hiện tại:{' '}
            <strong>{bestScore} điểm</strong>.
          </p>
          <div className="overview-card-actions">
            <button type="button" className="primary-button" onClick={onStartExam}>
              Thi cuối khóa
            </button>
            {firstUnpassed && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => onOpenLesson(firstUnpassed.id)}
              >
                Tiếp tục học
              </button>
            )}
          </div>
        </section>

        <section className="overview-card">
          <h2>Chứng chỉ</h2>
          {eligibility.eligible ? (
            <p>Đủ điều kiện cấp chứng chỉ. Nhập họ tên để nhận chứng chỉ cục bộ.</p>
          ) : (
            <>
              <p>Chưa đủ điều kiện chứng chỉ.</p>
              <ul className="overview-reasons">
                {eligibility.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          )}
          <div className="overview-card-actions">
            <button type="button" className="ghost-button" onClick={onOpenCertificate}>
              Mở chứng chỉ
            </button>
          </div>
        </section>
      </div>

      <p className="overview-note">
        Chứng chỉ do ứng dụng cục bộ cấp, không phải chứng chỉ được công nhận bên ngoài.
      </p>
    </section>
  )
}
