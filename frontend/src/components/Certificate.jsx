import { useRef, useState } from 'react'
import {
  canIssue,
  createCertificate,
  loadCertificate,
  saveCertificate,
} from '../lib/certificate.js'
import { summarize } from '../lib/courseProgress.js'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN')
}

function downloadSvg(svg) {
  const markup = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'chung-chi-sql-lab.svg'
  link.click()
  URL.revokeObjectURL(url)
}

function printSvg(svg) {
  const markup = new XMLSerializer().serializeToString(svg)
  const frame = document.createElement('iframe')

  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)

  const doc = frame.contentWindow.document
  doc.open()
  doc.write(
    `<!doctype html><html><head><title>Chứng chỉ SQL Lab</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0}svg{width:100%;height:auto;display:block}</style></head><body>${markup}</body></html>`,
  )
  doc.close()
  frame.contentWindow.focus()
  frame.contentWindow.print()
  frame.remove()
}

export default function Certificate({ course, progress }) {
  const [name, setName] = useState('')
  const [certificate, setCertificate] = useState(loadCertificate)
  const svgRef = useRef(null)
  const eligibility = canIssue(progress, course)
  const summary = summarize(course, progress)

  const issue = () => {
    const next = createCertificate({
      name,
      score: progress?.exam?.bestScore ?? 0,
      exercisesPassed: summary.exercisesPassed,
      lessonsPassed: summary.lessonsPassed,
    })

    saveCertificate(next)
    setCertificate(next)
  }

  if (!eligibility.eligible) {
    return (
      <section className="certificate-view">
        <header className="certificate-head">
          <p className="eyebrow">Chứng chỉ</p>
          <h2>Chứng nhận hoàn thành khóa học</h2>
        </header>

        <div className="certificate-locked">
          <p className="certificate-locked-title">Chưa đủ điều kiện chứng chỉ.</p>
          <ul className="overview-reasons">
            {eligibility.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="results-meta">
            Đã pass {eligibility.modulesPassed}/{eligibility.modulesTotal} module · điểm thi cao nhất{' '}
            {eligibility.bestScore}/100.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="certificate-view">
      <header className="certificate-head">
        <p className="eyebrow">Chứng chỉ</p>
        <h2>Chứng nhận hoàn thành khóa học</h2>
        <p className="certificate-lead">
          Đủ điều kiện cấp chứng chỉ: {eligibility.modulesPassed}/{eligibility.modulesTotal} module đã
          pass và điểm thi {eligibility.bestScore}/100. Chứng chỉ được cấp cục bộ trong ứng dụng, không
          phải chứng nhận bên ngoài.
        </p>
      </header>

      {!certificate ? (
        <div className="certificate-form">
          <label className="field-label" htmlFor="certificate-name">
            Họ tên trên chứng chỉ
          </label>
          <input
            id="certificate-name"
            className="certificate-input"
            type="text"
            value={name}
            placeholder="Ví dụ: Nguyễn Văn An"
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className="primary-button"
            onClick={issue}
            disabled={!name.trim()}
          >
            Cấp chứng chỉ
          </button>
        </div>
      ) : (
        <>
          <div className="certificate-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => svgRef.current && downloadSvg(svgRef.current)}
            >
              Tải SVG
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => svgRef.current && printSvg(svgRef.current)}
            >
              In / Lưu PDF
            </button>
            <button type="button" className="ghost-button" onClick={() => setCertificate(null)}>
              Cấp lại
            </button>
          </div>

          <div className="certificate-frame">
            <svg
              ref={svgRef}
              className="certificate-svg"
              viewBox="0 0 1123 794"
              role="img"
              aria-label="Chứng chỉ hoàn thành khóa SQL Lab"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="1123" height="794" fill="#0E1620" />
              <rect x="26" y="26" width="1071" height="742" fill="none" stroke="#D4A24A" strokeWidth="2" />
              <rect x="40" y="40" width="1043" height="714" fill="none" stroke="#D4A24A" strokeOpacity="0.35" />

              <text x="80" y="120" fill="#D4A24A" fontFamily="Georgia, serif" fontSize="15" letterSpacing="6">
                MYSQL LAB · SQL THỰC CHIẾN
              </text>
              <text x="80" y="205" fill="#F4F7FA" fontFamily="Georgia, serif" fontSize="46">
                Chứng nhận hoàn thành
              </text>
              <text x="80" y="252" fill="#9FB0C0" fontFamily="Segoe UI, sans-serif" fontSize="17">
                Khóa học SQL thực chiến cho Data Science, Data Engineering và Machine Learning
              </text>

              <text x="80" y="340" fill="#9FB0C0" fontFamily="Segoe UI, sans-serif" fontSize="14">
                Cấp cho
              </text>
              <text x="80" y="392" fill="#F4F7FA" fontFamily="Georgia, serif" fontSize="38">
                {certificate.holderName}
              </text>
              <line x1="80" y1="414" x2="720" y2="414" stroke="#D4A24A" strokeOpacity="0.5" />

              <text x="80" y="470" fill="#9FB0C0" fontFamily="Segoe UI, sans-serif" fontSize="14">
                Đã hoàn thành {certificate.lessonsPassed} bài học, {certificate.exercisesPassed} bài tập
                và bài thi cuối khóa với điểm {certificate.score}/100.
              </text>

              <text x="80" y="570" fill="#9FB0C0" fontFamily="Segoe UI, sans-serif" fontSize="13">
                Mã chứng chỉ
              </text>
              <text x="80" y="600" fill="#D4A24A" fontFamily="Consolas, monospace" fontSize="17">
                {certificate.id}
              </text>

              <text x="80" y="670" fill="#9FB0C0" fontFamily="Segoe UI, sans-serif" fontSize="13">
                Ngày cấp
              </text>
              <text x="80" y="696" fill="#F4F7FA" fontFamily="Segoe UI, sans-serif" fontSize="16">
                {formatDate(certificate.issuedAt)}
              </text>

              <circle cx="960" cy="600" r="72" fill="none" stroke="#D4A24A" strokeWidth="2" />
              <circle cx="960" cy="600" r="62" fill="none" stroke="#D4A24A" strokeOpacity="0.4" />
              <text x="960" y="592" textAnchor="middle" fill="#D4A24A" fontFamily="Georgia, serif" fontSize="18">
                SQL
              </text>
              <text x="960" y="620" textAnchor="middle" fill="#D4A24A" fontFamily="Georgia, serif" fontSize="18">
                LAB
              </text>
              <text x="80" y="738" fill="#6F8296" fontFamily="Segoe UI, sans-serif" fontSize="11">
                Chứng chỉ cục bộ do ứng dụng MySQL Lab cấp, không được công nhận bên ngoài.
              </text>
            </svg>
          </div>
        </>
      )}
    </section>
  )
}
