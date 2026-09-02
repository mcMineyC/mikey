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

            const attrs = plan.attributes || plan.rawData?.attributes || {};

            const planCenterId = String(plan.id);

            const title =
                attrs.title ||
                'Untitled Plan';

            const planningCenterUrl =
                attrs.planning_center_url ||
                `https://services.planningcenteronline.com/plans/${planCenterId}`;

            /*
            * Planning Center's sort_date is the actual plan start
            * timestamp.
            */
            let startTime = null;

            if (attrs.sort_date) {
                const parsedStartTime = new Date(attrs.sort_date);

                if (!Number.isNaN(parsedStartTime.getTime())) {
                    startTime = parsedStartTime;
                }
            }

            /*
            * Planning Center's total_length is in seconds.
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
            * Build the plan insert object without undefined values.
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
            * Upsert the plan.
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
            * Before importing assignments, remove the plan's existing
            * assignments.
            *
            * This is important because assignments can change between
            * syncs.
            *
            * Example:
            *
            * Previous sync:
            *   Chloe → Keys
            *   Chloe → Worship Leader
            *
            * Current sync:
            *   Chloe → Worship Leader
            *
            * Removing the old assignments first prevents "Keys" from
            * incorrectly remaining attached to the plan.
            */
            await this.db
                .delete(schema.planAssignments)
                .where(
                    eq(
                        schema.planAssignments.planId,
                        insertedPlan.id
                    )
                );

            let peopleCount = 0;
            let assignmentCount = 0;

            if (Array.isArray(people) && people.length > 0) {
                for (const person of people) {

                    person.id = person.rawData.relationships.person.data.id
                    if (!person || !person.id) {
                        console.warn(
                            'Skipping person with no Planning Center ID:',
                            person
                        );
                        continue;
                    }

                    /*
                    * Upsert the person itself.
                    *
                    * The person's positionName is NOT used as the
                    * plan-specific assignment. The assignment below
                    * contains the role for this particular plan.
                    */
                    const personValues = {
                        planCenterId: String(person.id),
                    };

                    if (
                        person.name !== undefined &&
                        person.name !== null
                    ) {
                        personValues.name = person.name;
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
                                name: person.name,
                                thumbnailUrl: person.photo_thumbnail_url,
                                updatedAt: new Date(),
                            },
                        })
                        .returning({
                            id: schema.people.id,
                        });

                    if (!upsertedPerson?.id) {
                        console.warn(
                            `Could not get database ID for person ${person.id}`
                        );
                        continue;
                    }

                    peopleCount++;

                    /*
                    * Planning Center returns the person's plan-specific
                    * role as team_position_name.
                    *
                    * Some people may have multiple entries in the
                    * `people` array with different roles.
                    *
                    * Example:
                    *
                    *   Chloe Feilteau (Keys)
                    *   Chloe Feilteau (Worship Leader)
                    *
                    * Those become two assignments.
                    */
                    const role =
                        person.team_position_name ||
                        person.position_name ||
                        person.role ||
                        null;

                    if (!role) {
                        console.warn(
                            `No role found for ${person.name || person.id}`
                        );
                        continue;
                    }

                    await this.db
                        .insert(schema.planAssignments)
                        .values({
                            planId: insertedPlan.id,
                            personId: upsertedPerson.id,
                            role,
                        })
                        .onConflictDoNothing();

                    assignmentCount++;
                }
            }

            console.log(
                `✓ Imported ${peopleCount} people`
            );

            console.log(
                `✓ Imported ${assignmentCount} assignments`
            );

            return {
                planId: insertedPlan.id,
                planCenterId,
                peopleCount,
                assignmentCount,
            };
        } catch (err) {
            console.error(
                'Error importing Planning Center data:',
                err
            );

            if (err.cause) {
                console.error(
                    'Underlying database error:',
                    err.cause
                );
            }

            throw err;
        }
    }

    async queryPlan({ planningCenterId, dbId } = {}) {
        if (!planningCenterId && !dbId) {
            throw new Error('Either planningCenterId or dbId must be provided');
        }

        const whereClause = planningCenterId
            ? eq(schema.plans.planCenterId, planningCenterId)
            : eq(schema.plans.id, dbId);

        const rows = await this.db
            .select({
                planId: schema.plans.id,
                planCenterId: schema.plans.planCenterId,
                title: schema.plans.title,
                startTime: schema.plans.startTime,
                duration: schema.plans.duration,
                planningCenterUrl: schema.plans.planningCenterUrl,

                assignmentId: schema.planAssignments.id,
                role: schema.planAssignments.role,

                personId: schema.people.id,
                personCenterId: schema.people.planCenterId,
                personName: schema.people.name,
                thumbnailUrl: schema.people.thumbnailUrl,
            })
            .from(schema.plans)
            .leftJoin(
                schema.planAssignments,
                eq(
                    schema.planAssignments.planId,
                    schema.plans.id
                )
            )
            .leftJoin(
                schema.people,
                eq(
                    schema.people.id,
                    schema.planAssignments.personId
                )
            )
            .where(
                planningCenterId
                    ? eq(schema.plans.planCenterId, planningCenterId)
                    : eq(schema.plans.id, dbId)
            );
            
        if (rows.length === 0) {
            return null;
        }

        const first = rows[0];

        const result = {
            id: first.planId,
            planCenterId: first.planCenterId,
            title: first.title,
            startTime: first.startTime,
            duration: first.duration,
            planningCenterUrl: first.planningCenterUrl,
            people: [],
        };

        const peopleById = new Map();

        for (const row of rows) {
            if (row.personId === null) {
                continue;
            }

            let person = peopleById.get(row.personId);

            if (!person) {
                person = {
                    id: row.personId,
                    planCenterId: row.personCenterId,
                    name: row.personName,
                    positionName: row.positionName,
                    thumbnailUrl: row.thumbnailUrl,
                    assignments: [],
                };

                peopleById.set(row.personId, person);
                result.people.push(person);
            }

            if (
                row.role !== null &&
                !person.assignments.includes(row.role)
            ) {
                person.assignments.push(row.role);
            }
        }

        return result;
        /*
            const test = await this.db
                .select({
                    planId: schema.plans.id,
                    assignmentId: schema.planAssignments.id,
                })
                .from(schema.plans)
                .leftJoin(
                    schema.planAssignments,
                    eq(
                        schema.planAssignments.planId,
                        schema.plans.id
                    )
                );

            console.log(test);
            */
    }
}


export const database = new Database();