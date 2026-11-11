import { describe, expect, it } from 'vitest'
import { emptyProgress, recordExercise, recordExam } from './courseProgress.js'
import { canIssue, certificateId, createCertificate } from './certificate.js'

const course = [
  {
    id: 'm1',
    title: 'Module 1',
    lessons: [{ id: 'm1-l1', title: 'Bài 1', exerciseCount: 1 }],
  },
  {
    id: 'm2',
    title: 'Module 2',
    lessons: [{ id: 'm2-l1', title: 'Bài 2', exerciseCount: 2 }],
  },
]

function completeCourse(score) {
  let progress = emptyProgress()
  for (const module of course) {
    for (const lesson of module.lessons) {
      for (let index = 0; index < lesson.exerciseCount; index += 1) {
        progress = recordExercise(progress, {
          lessonId: lesson.id,
          exerciseId: `${lesson.id}-ex${index}`,
          correct: true,
        })
      }
    }
  }
  return recordExam(progress, { score })
}

describe('certificateId', () => {
  it('đúng định dạng SQLLAB-2026-XXXXXX', () => {
    expect(certificateId('Nguyễn Văn An', '2026-11-11T10:00:00.000Z', 90)).toMatch(
      /^SQLLAB-2026-[0-9A-Z]{6}$/,
    )
  })

  it('ổn định với cùng đầu vào và đổi khi đổi tên', () => {
    const first = certificateId('Nguyễn Văn An', '2026-11-11T10:00:00.000Z', 90)
    const second = certificateId('Nguyễn Văn An', '2026-11-11T10:00:00.000Z', 90)
    const other = certificateId('Trần Thị Bình', '2026-11-11T10:00:00.000Z', 90)

    expect(first).toBe(second)
    expect(other).not.toBe(first)
  })
})

describe('canIssue', () => {
  it('chưa hoàn thành module thì chưa đủ điều kiện', () => {
    const result = canIssue(emptyProgress(), course)

    expect(result.eligible).toBe(false)
    expect(result.modulesPassed).toBe(0)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('điểm thi 79 chặn chứng chỉ dù đã pass module', () => {
    const result = canIssue(completeCourse(79), course)

    expect(result.eligible).toBe(false)
    expect(result.examPassed).toBe(false)
    expect(result.bestScore).toBe(79)
  })

  it('pass đủ module và thi >= 80 thì đủ điều kiện', () => {
    const result = canIssue(completeCourse(80), course)

    expect(result.eligible).toBe(true)
    expect(result.modulesPassed).toBe(2)
    expect(result.modulesTotal).toBe(2)
    expect(result.examPassed).toBe(true)
    expect(result.reasons).toEqual([])
  })
})

describe('createCertificate', () => {
  it('tạo snapshot đủ thông tin và mã', () => {
    const certificate = createCertificate({
      name: ' Nguyễn Văn An ',
      score: 92,
      exercisesPassed: 53,
      lessonsPassed: 44,
      issuedAt: '2026-11-11T10:00:00.000Z',
    })

    expect(certificate.holderName).toBe('Nguyễn Văn An')
    expect(certificate.score).toBe(92)
    expect(certificate.exercisesPassed).toBe(53)
    expect(certificate.lessonsPassed).toBe(44)
    expect(certificate.issuedAt).toBe('2026-11-11T10:00:00.000Z')
    expect(certificate.id).toBe(
      certificateId('Nguyễn Văn An', '2026-11-11T10:00:00.000Z', 92),
    )
  })
})
