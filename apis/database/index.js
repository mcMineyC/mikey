import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
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

            // Planning Center API response structure:
            //
            // plan = {
            //   type: "Plan",
            //   id: "90641360",
            //   attributes: {
            //     title: "Consider War: Eli",
            //     dates: "August 29, 2026",
            //     sort_date: "2026-08-29T16:00:00Z",
            //     total_length: 3919,
            //     planning_center_url: "https://services.planningcenteronline.com/plans/90641360",
            //     ...
            //   }
            // }

            const attrs = plan.attributes || plan.rawData?.attributes || {};

            const planCenterId = String(plan.id);

            const title = attrs.title || 'Untitled Plan';

            const planningCenterUrl =
                attrs.planning_center_url ||
                `https://services.planningcenteronline.com/plans/${planCenterId}`;

            /*
            * Planning Center's `sort_date` is the actual ISO timestamp
            * representing the plan's date/time.
            *
            * Example:
            *   "2026-08-29T16:00:00Z"
            */
            let startTime = null;

            if (attrs.sort_date) {
                const parsedStartTime = new Date(attrs.sort_date);

                if (!Number.isNaN(parsedStartTime.getTime())) {
                    startTime = parsedStartTime;
                }
            }

            /*
            * Planning Center's `total_length` is the total plan length
            * in seconds.
            *
            * Example:
            *   3919 seconds = ~65.3 minutes
            *
            * If the database's `duration` column is intended to store
            * seconds, keep this value as-is.
            */
            let duration = null;

            if (
                attrs.total_length !== null &&
                attrs.total_length !== undefined
            ) {
                const parsedDuration = Number(attrs.total_length);

                if (!Number.isNaN(parsedDuration)) {
                    duration = parsedDuration;
                }
            }

            console.log('Importing plan:', {
                planCenterId,
                title,
                startTime,
                duration,
                planningCenterUrl,
            });

            /*
            * Build the insert object dynamically.
            *
            * This is important because we don't want undefined values
            * being sent to PostgreSQL as DEFAULT.
            */
            const planValues = {
                planCenterId,
                title,
                planningCenterUrl,
            };

            if (startTime !== null) {
                planValues.startTime = startTime;
            }

            if (duration !== null) {
                planValues.duration = duration;
            }

            /*
            * Upsert plan.
            */
            const [insertedPlan] = await this.db
                .insert(schema.plans)
                .values(planValues)
                .onConflictDoUpdate({
                    target: schema.plans.planCenterId,
                    set: {
                        title,
                        planningCenterUrl,

                        ...(startTime !== null
                            ? { startTime }
                            : {}),

                        ...(duration !== null
                            ? { duration }
                            : {}),

                        updatedAt: new Date(),
                    },
                })
                .returning({
                    id: schema.plans.id,
                    planCenterId: schema.plans.planCenterId,
                    title: schema.plans.title,
                });

            console.log(
                `✓ Plan imported: ${insertedPlan.title} ` +
                `(ID: ${insertedPlan.planCenterId})`
            );

            /*
            * Import people associated with the plan.
            */
            let peopleCount = 0;
            const personIds = [];

            if (Array.isArray(people) && people.length > 0) {
                for (const person of people) {
                    if (!person || !person.id) {
                        console.warn(
                            'Skipping person with no Planning Center ID:',
                            person
                        );
                        continue;
                    }

                    const personValues = {
                        planCenterId: String(person.id),
                    };

                    if (person.name !== undefined && person.name !== null) {
                        personValues.name = person.name;
                    }

                    if (
                        person.team_position_name !== undefined &&
                        person.team_position_name !== null
                    ) {
                        personValues.positionName =
                            person.team_position_name;
                    }

                    if (
                        person.photo_thumbnail_url !== undefined &&
                        person.photo_thumbnail_url !== null
                    ) {
                        personValues.thumbnailUrl =
                            person.photo_thumbnail_url;
                    }

                    const [upsertedPerson] = await this.db
                        .insert(schema.people)
                        .values(personValues)
                        .onConflictDoUpdate({
                            target: schema.people.planCenterId,
                            set: {
                                ...(person.name !== undefined &&
                                person.name !== null
                                    ? { name: person.name }
                                    : {}),

                                ...(person.team_position_name !== undefined &&
                                person.team_position_name !== null
                                    ? {
                                        positionName:
                                            person.team_position_name,
                                    }
                                    : {}),

                                ...(person.photo_thumbnail_url !== undefined &&
                                person.photo_thumbnail_url !== null
                                    ? {
                                        thumbnailUrl:
                                            person.photo_thumbnail_url,
                                    }
                                    : {}),

                                updatedAt: new Date(),
                            },
                        })
                        .returning({
                            id: schema.people.id,
                        });

                    if (upsertedPerson?.id) {
                        personIds.push(upsertedPerson.id);
                        peopleCount++;
                    }
                }
            }

            /*
            * Store the database IDs of the people associated with this plan.
            */
            await this.db
                .update(schema.plans)
                .set({
                    personIds,
                    updatedAt: new Date(),
                })
                .where(eq(schema.plans.id, insertedPlan.id));

            console.log(`✓ Imported ${peopleCount} people`);

            return {
                planId: insertedPlan.id,
                planCenterId,
                personIds,
                peopleCount,
            };
        } catch (err) {
            console.error(
                'Error importing Planning Center data:',
                err
            );

            // Drizzle/Postgres errors can contain the actual database
            // error in `cause`, so log it if available.
            if (err.cause) {
                console.error(
                    'Underlying database error:',
                    err.cause
                );
            }

            throw err;
        }
    }
}


export const database = new Database();