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

// Fetch Planning Center data
try {
    const SERVICE_TYPE_ID = process.env.PLANNING_CENTER_SERVICE_TYPE_ID;

    const nextPlan = await pc.getNextPlan(SERVICE_TYPE_ID);
    if (!nextPlan) {
        console.log('No upcoming plans found');
    } else {
        console.log('Next plan:', { id: nextPlan.id, type: nextPlan.type });

        const scheduledTeam = await pc.getScheduledTeam(SERVICE_TYPE_ID, nextPlan.id);
        await pc.cacheTeamImages(scheduledTeam);
        
        for (const member of scheduledTeam) {
            console.log(`- ${member.name} (${member.team_position_name})`);
        }
        fs.writeFileSync(
            'next_plan_and_team.json',
            JSON.stringify({ plan: nextPlan.rawData, scheduledPeople: scheduledTeam }, null, 2)
        );
        await pgdb.importPlanningCenterData(nextPlan, scheduledTeam);
        console.log('✓ Wrote next_plan_and_team.json and imported data into database');
    }
} catch (err) {
    console.warn('⚠ Planning Center sync failed:', err && err.message ? err.message : err);
}