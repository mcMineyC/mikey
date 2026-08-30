import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: './apis/database/schema.js',
    out: './apis/database/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
