import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema.js';

/**
 * Database client class with Drizzle ORM
 * Manages PostgreSQL connection pool and provides ORM functionality
 */
class Database {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('Missing DATABASE_URL env var');
        }

        const pool = new Pool({
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        this.pool = pool;
        this.db = drizzle(pool, { schema });
    }

    /**
     * Test the database connection
     */
    async test() {
        try {
            const result = await this.db.execute('SELECT NOW() AS now');
            console.log('✓ Postgres connected:', new Date());
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
     * Get Drizzle instance for direct ORM access
     */
    getDrizzle() {
        return this.db;
    }

    /**
     * Execute raw SQL query
     */
    async query(sql, values) {
        return this.pool.query(sql, values);
    }

    /**
     * Import planning center plan and people data
     * @param {Object} plan - Plan data from Planning Center API
     * @param {Array} people - Array of people data from Planning Center API
     * @returns {Promise<Object>} Result object with plan ID and inserted people count
     */
    async importPlanningCenterData(plan, people) {
        try {
            if (!plan) {
                throw new Error('Plan data is required');
            }

            // Extract plan data - handle different possible structures
            const attrs = plan.rawData?.attributes || plan.attributes || {};
            
            // Build plan data object, excluding null values
            const planData = {
                planCenterId: plan.id,
                title: attrs.name || 'Untitled Plan',
                planningCenterUrl: `https://services.planningcenteronline.com/plans/${plan.id}`,
            };

            // Only add optional fields if they have values
            const startTime = attrs.dates?.start_time 
                ? new Date(attrs.dates.start_time) 
                : (attrs.start_time ? new Date(attrs.start_time) : null);
            if (startTime) {
                planData.startTime = startTime;
            }

            const duration = attrs.dates?.duration_minutes || attrs.duration_minutes;
            if (duration) {
                planData.duration = duration;
            }

            console.log(`Importing plan: ${JSON.stringify(planData)}`);

            // Check if plan exists
            const existingPlan = await this.db
                .select()
                .from(schema.plans)
                .where(eq(schema.plans.planCenterId, plan.id));

            let insertedPlan;
            if (existingPlan.length > 0) {
                // Update existing plan
                const [updated] = await this.db
                    .update(schema.plans)
                    .set({
                        title: planData.title,
                        startTime: planData.startTime,
                        duration: planData.duration,
                        planningCenterUrl: planData.planningCenterUrl,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.plans.planCenterId, plan.id))
                    .returning();
                insertedPlan = updated;
                console.log(`✓ Plan updated: ${planData.title} (ID: ${plan.id})`);
            } else {
                // Insert new plan
                const [inserted] = await this.db
                    .insert(schema.plans)
                    .values(planData)
                    .returning();
                insertedPlan = inserted;
                console.log(`✓ Plan created: ${planData.title} (ID: ${plan.id})`);
            }

            // Import people
            let peopleCount = 0;
            const personIds = [];
            
            if (Array.isArray(people) && people.length > 0) {
                for (const person of people) {
                    const personData = {
                        planCenterId: person.id,
                        name: person.name,
                        positionName: person.team_position_name,
                        thumbnailUrl: person.photo_thumbnail_url,
                    };

                    // Collect person Planning Center ID
                    personIds.push(person.id);

                    // Check if person exists
                    const existingPerson = await this.db
                        .select()
                        .from(schema.people)
                        .where(eq(schema.people.planCenterId, person.id));

                    if (existingPerson.length > 0) {
                        await this.db
                            .update(schema.people)
                            .set({
                                name: personData.name,
                                positionName: personData.positionName,
                                thumbnailUrl: personData.thumbnailUrl,
                                updatedAt: new Date(),
                            })
                            .where(eq(schema.people.planCenterId, person.id));
                    } else {
                        await this.db
                            .insert(schema.people)
                            .values(personData);
                    }

                    peopleCount++;
                }
            }

            // Update plan with list of person IDs
            if (existingPlan.length > 0) {
                await this.db
                    .update(schema.plans)
                    .set({
                        personIds: personIds,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.plans.planCenterId, plan.id));
            } else {
                planData.personIds = personIds;
            }

            console.log(`✓ Imported ${peopleCount} people`);

            return {
                planId: insertedPlan.id,
                planCenterId: plan.id,
                personIds: personIds,
                peopleCount,
            };
        } catch (err) {
            console.error('Error importing Planning Center data:', err.message);
            throw err;
        }
    }
}

export const database = new Database();