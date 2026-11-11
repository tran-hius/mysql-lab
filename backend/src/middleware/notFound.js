export function notFound(req, res) {
  res.status(404).json({
    ok: false,
    error: 'NOT_FOUND',
    message: `Không tìm thấy ${req.method} ${req.originalUrl}`,
  });
}
