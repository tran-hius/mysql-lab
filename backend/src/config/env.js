import 'dotenv/config';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 4000),
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'mysql_lab',
    readerUser: process.env.DB_READER_USER ?? 'lab_reader',
    readerPassword: process.env.DB_READER_PASSWORD ?? '',
    readerDatabase: 'shop',
    connectionLimit: toNumber(process.env.DB_POOL_SIZE, 10),
  },
};

export const isProduction = env.nodeEnv === 'production';
