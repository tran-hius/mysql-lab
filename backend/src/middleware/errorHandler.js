import { isProduction } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  const status = error.status ?? 500;

  if (status >= 500) {
    console.error('[api] Lỗi:', error);
  }

  res.status(status).json({
    ok: false,
    error: error.code ?? 'INTERNAL_ERROR',
    message: isProduction && status >= 500
      ? 'Đã có lỗi xảy ra, vui lòng thử lại sau.'
      : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
  });
}
