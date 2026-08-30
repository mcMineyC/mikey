# Drizzle ORM Setup

Drizzle ORM is integrated into the `database` module for type-safe database access.

## Usage

### Basic Access
```javascript
import { database as db } from './apis/database/index.js';

// Get Drizzle instance for ORM operations
const drizzleDb = db.getDb();

// Use Drizzle for type-safe queries
import { services } from './apis/database/schema.js';
const result = await drizzleDb.select().from(services);
```

### Schema
Define your tables in `apis/database/schema.js`. Currently defined:
- `services` - Service type and plan data
- `teamMembers` - Team member information for plans

### Migrations
Generate migrations after schema changes:
```bash
npx drizzle-kit generate
```

Push migrations to database:
```bash
npx drizzle-kit push
```

### Raw Queries
For complex queries, use raw SQL:
```javascript
const result = await db.query('SELECT * FROM services WHERE plan_id = $1', [planId]);
```

## Configuration
- Config: `drizzle.config.js`
- Schema: `apis/database/schema.js`
- Migrations: `apis/database/migrations/`
