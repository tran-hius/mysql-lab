const baseUrl = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, { status, hint } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.hint = hint
  }
}

async function request(path, signal) {
  let response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Không gọi được API. Backend đã chạy chưa?')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok || !body?.ok) {
    throw new ApiError(body?.message ?? 'Yêu cầu thất bại', {
      status: response.status,
      hint: body?.hint,
    })
  }

  return body
}

export async function getQueries(signal) {
  const body = await request('/api/queries', signal)
  return body.queries
}

export async function runQuery(id, signal) {
  return request(`/api/queries/${encodeURIComponent(id)}`, signal)
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
