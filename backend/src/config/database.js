const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  database: process.env.DATABASE_NAME || 'adhira',
  user: process.env.DATABASE_USER || 'euser',
  password: process.env.DATABASE_PASSWORD || 'epass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Run fn(client) inside a BEGIN/COMMIT transaction on a dedicated connection,
// rolling back on any error. Use for multi-statement writes that must be
// atomic (fn must use the passed client, not the shared pool, for its queries).
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
