import { Pool } from 'pg';

/**
 * Database client class
 * Manages PostgreSQL connection pool
 */
class Database {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('Missing DATABASE_URL env var');
        }

        this.pool = new Pool({
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
    }

    /**
     * Test the database connection
     */
    async test() {
        try {
            const { rows } = await this.pool.query('SELECT NOW() AS now');
            console.log('✓ Postgres connected:', rows[0].now);
            return true;
        } catch (err) {
            console.error('✗ Database error:', err);
            throw err;
        }
    }

    /**
     * Close the connection pool
     */
    async close() {
        await this.pool.end();
    }

    /**
     * Execute a query
     */
    async query(sql, values) {
        return this.pool.query(sql, values);
    }
}

export const database = new Database();
