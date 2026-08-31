import fs from 'fs';
import { database as pgdb } from '../apis/database/index.js';
import { planningCenter as pc } from '../apis/planning_center/index.js';
// Initialize database
try {
    await pgdb.test();
} catch (err) {
    process.exitCode = 1;
} finally {
    // await pgdb.close();
}

const db = pgdb.getDrizzle();

// Fetch Planning Center data
try {
    const SERVICE_TYPE_ID = process.env.PLANNING_CENTER_SERVICE_TYPE_ID;

    const plans = await pc.getNewestPlans(SERVICE_TYPE_ID, 15, 0); // capped at 15

    if (!plans || plans.length === 0) {
        console.log('No plans found');
    } else {
        for (const nextPlan of plans) {
            console.log('Next plan:', { id: nextPlan.id, title: nextPlan.title, type: nextPlan.type });

            const scheduledTeam = await pc.getScheduledTeam(SERVICE_TYPE_ID, nextPlan.id);
            await pc.cacheTeamImages(scheduledTeam);
            
            for (const member of scheduledTeam) {
                console.log(`- ${member.name} (${member.team_position_name})`);
            }
            await pgdb.importPlanningCenterData(nextPlan, scheduledTeam);
            console.log('✓ Imported data into database');
        }
    }
} catch (err) {
    console.warn('⚠ Planning Center sync failed:', err && err.message ? err.message : err);
}
