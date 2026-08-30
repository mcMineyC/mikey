import fs from 'fs';
import { database } from './apis/database/index.js';
import { planningCenter } from './apis/planning_center/index.js';

// Initialize database
try {
    await database.test();
} catch (err) {
    process.exitCode = 1;
} finally {
    await database.close();
}

// Fetch Planning Center data
try {
    const SERVICE_TYPE_ID = 6644;

    const nextPlan = await planningCenter.getNextPlan(SERVICE_TYPE_ID);
    if (!nextPlan) {
        console.log('No upcoming plans found');
    } else {
        console.log('Next plan:', { id: nextPlan.id, type: nextPlan.type });

        const scheduledTeam = await planningCenter.getScheduledTeam(SERVICE_TYPE_ID, nextPlan.id);

        fs.writeFileSync(
            'next_plan_and_team.json',
            JSON.stringify({ plan: nextPlan.rawData, scheduledPeople: scheduledTeam }, null, 2)
        );
        console.log('✓ Wrote next_plan_and_team.json');
    }
} catch (err) {
    console.warn('⚠ Planning Center sync failed:', err && err.message ? err.message : err);
}