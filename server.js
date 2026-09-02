import fs from 'fs';
import { database as pgdb } from './apis/database/index.js';
import { planningCenter as pc } from './apis/planning_center/index.js';
// Initialize database
try {
    await pgdb.test();
} catch (err) {
    process.exitCode = 1;
} finally {
    // await pgdb.close();
}

const db = pgdb.getDrizzle();

// Qeury DB for plan with id 34
console.log(JSON.stringify(await pgdb.queryPlan({planningCenterId: '90641360'}), null, 2));

// Fetch Planning Center data

try {
    const SERVICE_TYPE_ID = process.env.PLANNING_CENTER_SERVICE_TYPE_ID;
    
} catch (err) {
    console.warn('⚠ Planning Center sync failed:', err && err.message ? err.message : err);
}
