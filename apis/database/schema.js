import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    unique,
    index,
} from 'drizzle-orm/pg-core';

export const plans = pgTable(
    'plans',
    {
        id: serial('id').primaryKey(),

        planCenterId: varchar('planning_center_id', {
            length: 255,
        }).notNull().unique(),

        title: varchar('title', {
            length: 255,
        }).notNull(),

        startTime: timestamp('start_time', {
            withTimezone: true,
        }),

        duration: integer('duration'),

        planningCenterUrl: varchar('planning_center_url', {
            length: 500,
        }),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        }).defaultNow().notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        }).defaultNow().notNull(),
    }
);

export const people = pgTable(
    'people',
    {
        id: serial('id').primaryKey(),

        planCenterId: varchar('planning_center_id', {
            length: 255,
        }).notNull().unique(),

        name: varchar('name', {
            length: 255,
        }),

        thumbnailUrl: varchar('thumbnail_url', {
            length: 1000,
        }),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        }).defaultNow().notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        }).defaultNow().notNull(),
    }
);

/*
 * A person's assignment belongs to a specific plan.
 *
 * The same person can have multiple assignments on the same plan:
 *
 *   Chloe → Keys
 *   Chloe → Worship Leader
 *
 * Therefore the uniqueness constraint is on:
 *
 *   plan + person + role
 */
export const planAssignments = pgTable(
    'plan_assignments',
    {
        id: serial('id').primaryKey(),

        planId: integer('plan_id')
            .notNull()
            .references(() => plans.id, {
                onDelete: 'cascade',
            }),

        personId: integer('person_id')
            .notNull()
            .references(() => people.id, {
                onDelete: 'cascade',
            }),

        role: varchar('role', {
            length: 255,
        }).notNull(),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        }).defaultNow().notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        }).defaultNow().notNull(),
    },
    (table) => ({
        planPersonRoleUnique: unique(
            'plan_assignments_plan_person_role_unique'
        ).on(
            table.planId,
            table.personId,
            table.role
        ),

        planIndex: index(
            'plan_assignments_plan_id_idx'
        ).on(table.planId),

        personIndex: index(
            'plan_assignments_person_id_idx'
        ).on(table.personId),
    })
);