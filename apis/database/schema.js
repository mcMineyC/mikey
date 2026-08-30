import { pgTable, serial, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';


export const plans = pgTable('plans', {
    id: serial('id').primaryKey(),
    planCenterId: text('planning_center_id').unique(),
    title: varchar('title'),
    startTime: timestamp('start_time'),
    duration: integer('duration'),
    planningCenterUrl: text('planning_center_url'),
    personIds: integer('person_ids').array(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const people = pgTable('people', {
    id: serial('id').primaryKey(),
    planCenterId: text('planning_center_id').unique(),
    name: varchar('name'),
    positionName: varchar('position_name'),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
