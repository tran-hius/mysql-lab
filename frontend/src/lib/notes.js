const NOTE_PREFIX = 'mysql-lab:notes:'

export function noteKey(lessonId) {
  return `${NOTE_PREFIX}${lessonId}`
}

export function loadNote(lessonId) {
  try {
    return localStorage.getItem(noteKey(lessonId)) ?? ''
  } catch {
    return ''
  }
}

export function saveNote(lessonId, text) {
  const value = String(text ?? '')
  try {
    if (value.trim() === '') {
      localStorage.removeItem(noteKey(lessonId))
    } else {
      localStorage.setItem(noteKey(lessonId), value)
    }
  } catch {
    // Ghi chú vẫn dùng được trong phiên hiện tại nếu localStorage bị chặn.
  }
  return value
}

export function exportNotes(course) {
  const modules = Array.isArray(course) ? course : (course?.modules ?? [])
  const lines = ['# Ghi chú khóa học MySQL Lab', '']
  let noteCount = 0

  for (const module of modules) {
    const lessonNotes = (module.lessons ?? [])
      .map((lesson) => [lesson, loadNote(lesson.id).trim()])
      .filter(([, note]) => note.length > 0)

    if (lessonNotes.length === 0) continue

    lines.push(`## ${module.title}`, '')
    for (const [lesson, note] of lessonNotes) {
      noteCount += 1
      lines.push(`### ${lesson.title}`, '', note, '')
    }
  }

  if (noteCount === 0) {
    lines.push('_Chưa có ghi chú._', '')
  }

  return lines.join('\n')
}
