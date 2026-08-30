import { Pool } from 'pg';

/**
 * Create and initialize a PostgreSQL connection pool
 */
export function createPool() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('Missing DATABASE_URL env var');
    }

    return new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
}

/**
 * Test the database connection
 */
export async function testConnection(pool) {
    try {
        const { rows } = await pool.query('SELECT NOW() AS now');
        console.log('✓ Postgres connected:', rows[0].now);
        return true;
    } catch (err) {
        console.error('✗ Database error:', err);
        throw err;
    }
}
