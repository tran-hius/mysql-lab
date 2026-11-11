import { PASS_SCORE, summarize } from './courseProgress.js'

const CERTIFICATE_KEY = 'mysql-lab:certificate'

function hashString(input) {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function certificateId(name, issuedAt, score) {
  const seed = `${String(name ?? '').trim()}|${issuedAt}|${score}`
  const code = hashString(seed).toString(36).toUpperCase().padStart(6, '0').slice(-6)
  return `SQLLAB-2026-${code}`
}

export function canIssue(progress, course) {
  const summary = summarize(course, progress)
  const bestScore = Number(progress?.exam?.bestScore ?? 0)
  const examPassed = bestScore >= PASS_SCORE
  const modulesPassed = summary.modules.filter((module) => module.passed).length
  const reasons = []

  if (!summary.coursePassed) {
    reasons.push(`Còn ${summary.modules.length - modulesPassed} module chưa pass`)
  }

  if (!examPassed) {
    reasons.push(`Điểm thi cao nhất ${bestScore}/100, cần ít nhất ${PASS_SCORE}`)
  }

  return {
    eligible: summary.coursePassed && examPassed,
    modulesPassed,
    modulesTotal: summary.modules.length,
    examPassed,
    bestScore,
    reasons,
  }
}

export function createCertificate({ name, score, exercisesPassed, lessonsPassed, issuedAt }) {
  const issued = issuedAt ?? new Date().toISOString()
  const holderName = String(name ?? '').trim()

  return {
    id: certificateId(holderName, issued, score),
    holderName,
    title: 'Chứng nhận hoàn thành khóa SQL thực chiến',
    score,
    exercisesPassed,
    lessonsPassed,
    issuedAt: issued,
  }
}

export function saveCertificate(certificate) {
  try {
    localStorage.setItem(CERTIFICATE_KEY, JSON.stringify(certificate))
  } catch {
    // Không lưu được vẫn có thể hiển thị chứng chỉ trong phiên hiện tại.
  }
  return certificate
}

export function loadCertificate() {
  try {
    const raw = localStorage.getItem(CERTIFICATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
