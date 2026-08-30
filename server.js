import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('Missing DATABASE_URL env var');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

try {
    const { rows } = await pool.query('SELECT NOW() AS now');
    console.log('Postgres time:', rows[0].now);
} catch (err) {
    console.error('Database error:', err);
    process.exitCode = 1;
} finally {
    await pool.end();
}