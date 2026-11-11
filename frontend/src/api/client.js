const baseUrl = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, { status, hint } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.hint = hint
  }
}

async function request(path, signal, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      signal,
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Không gọi được API. Backend đã chạy chưa?')
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.ok) {
    throw new ApiError(data?.message ?? 'Yêu cầu thất bại', {
      status: response.status,
      hint: data?.hint,
    })
  }

  return data
}

export async function getQueries(signal) {
  const body = await request('/api/queries', signal)
  return body.queries
}

export async function runQuery(id, signal) {
  return request(`/api/queries/${encodeURIComponent(id)}`, signal)
}

export async function getCourse(signal) {
  const body = await request('/api/course', signal)
  return body.modules
}

export async function getLesson(id, signal) {
  return request(`/api/course/lessons/${encodeURIComponent(id)}`, signal)
}

export async function solveExercise(id, sql, signal) {
  return request(`/api/course/exercises/${encodeURIComponent(id)}/solve`, signal, {
    method: 'POST',
    body: { sql },
  })
}

export async function answerQuiz(id, choice, signal) {
  return request(`/api/course/exercises/${encodeURIComponent(id)}/answer`, signal, {
    method: 'POST',
    body: { choice },
  })
}

export async function getExerciseSolution(id, signal) {
  return request(`/api/course/exercises/${encodeURIComponent(id)}/solution`, signal)
}

export async function getExam(signal) {
  return request('/api/course/exam', signal)
}

export async function submitExam(items, signal) {
  return request('/api/course/exam/submit', signal, {
    method: 'POST',
    body: { items },
  })
}

export async function getSchema(signal) {
  return request('/api/schema', signal)
}

export async function runSandbox(sql, signal) {
  return request('/api/sandbox', signal, {
    method: 'POST',
    body: { sql },
  })
}

export async function getHealth(signal) {
  const response = await fetch(`${baseUrl}/api/health`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  const data = await response.json().catch(() => null)

  if (!data) {
    throw new Error('API trả về dữ liệu không hợp lệ')
  }

  return data
}
