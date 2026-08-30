/**
 * Planning Center Services API module
 * Handles service types and plans
 */

export async function getNextPlan(client, serviceTypeId) {
    try {
        const upcomingResp = await client.get(
            `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?filter=future&order=sort_date&per_page=1`
        );

        const nextPlan = Array.isArray(upcomingResp.data) && upcomingResp.data[0];
        if (!nextPlan) {
            console.log(`No upcoming plans found for service type ${serviceTypeId}`);
            return null;
        }

        return {
            id: nextPlan.id,
            type: nextPlan.type,
            attributes: nextPlan.attributes,
            rawData: nextPlan
        };
    } catch (err) {
        console.error('Error fetching next plan:', err.message);
        throw err;
    }
}

export async function getPlan(client, serviceTypeId, planId) {
    try {
        const resp = await client.get(
            `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans/${planId}`
        );

        if (!resp.data) {
            throw new Error(`Plan ${planId} not found`);
        }

        return {
            id: resp.data.id,
            type: resp.data.type,
            attributes: resp.data.attributes,
            rawData: resp.data
        };
    } catch (err) {
        console.error(`Error fetching plan ${planId}:`, err.message);
        throw err;
    }
}
