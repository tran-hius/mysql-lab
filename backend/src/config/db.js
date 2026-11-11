import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Pool kết nối dùng chung cho toàn bộ app.
 * Luôn dùng placeholder (?) khi truyền tham số để tránh SQL injection.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
  charset: 'utf8mb4_unicode_ci',
});

/** Kiểm tra nhanh kết nối + thông tin server MySQL. */
export async function getDatabaseInfo() {
  const [rows] = await pool.query(
    'SELECT DATABASE() AS db, VERSION() AS version, NOW() AS serverTime',
  );
  return rows[0];
}

/** Chạy một hàm trong transaction, tự rollback nếu lỗi. */
export async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
