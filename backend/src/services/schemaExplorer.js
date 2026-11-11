import { readerPool } from '../config/readerPool.js';

let cache = null;

const quote = (identifier) => `\`${String(identifier).replaceAll('`', '``')}\``;

async function loadSchema() {
  const [tableRows] = await readerPool.query(
    `SELECT TABLE_NAME AS name
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME`,
    ['shop'],
  );

  const [columnRows] = await readerPool.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name,
            COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_KEY AS \`key\`
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    ['shop'],
  );

  const tables = [];

  for (const { name } of tableRows) {
    const [[{ total }]] = await readerPool.query(
      `SELECT COUNT(*) AS total FROM ${quote(name)}`,
    );
    const [sampleRows] = await readerPool.query(`SELECT * FROM ${quote(name)} LIMIT 3`);

    tables.push({
      name,
      rowCount: Number(total),
      columns: columnRows
        .filter((column) => column.tableName === name)
        .map((column) => ({
          name: column.name,
          type: column.type,
          nullable: column.nullable === 'YES',
          key: column.key,
        })),
      sampleRows,
    });
  }

  return { database: 'shop', tables };
}

/** Metadata của database luyện tập, cache trong RAM (schema tĩnh). */
export async function getSchema({ refresh = false } = {}) {
  if (!cache || refresh) {
    cache = await loadSchema();
  }
  return cache;
}
