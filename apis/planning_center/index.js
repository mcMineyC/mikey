/**
 * Planning Center API - Main module
 * Exports Planning Center API as a singleton object
 */

import { PlanningCenterClient, createClientFromEnv } from './planning_center.js';
import { PlanningCenterAPI } from './api.js';

const client = createClientFromEnv();
export const planningCenter = new PlanningCenterAPI(client);
