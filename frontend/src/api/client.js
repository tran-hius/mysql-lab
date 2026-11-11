const baseUrl = import.meta.env.VITE_API_URL ?? ''

/** Gọi GET /api/health. Trả về cả phản hồi 503 để UI hiển thị đúng trạng thái. */
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
