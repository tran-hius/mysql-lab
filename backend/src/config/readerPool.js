import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Pool riêng cho phần luyện tập: user chỉ có SELECT trên database `shop`.
 * Hàng rào chính là quyền MySQL, không phải guard chuỗi.
 */
export const readerPool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.readerUser,
  password: env.db.readerPassword,
  database: env.db.readerDatabase,
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4_unicode_ci',
});

readerPool.on('connection', (connection) => {
  connection.query('SET SESSION MAX_EXECUTION_TIME = 2000');
});
