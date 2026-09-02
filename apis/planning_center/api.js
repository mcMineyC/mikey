/**
 * Planning Center API - Unified client class
 * Provides all Planning Center API methods through a single object
 */

export class PlanningCenterAPI {
    constructor(client, imageCache) {
        this.client = client;
        this.imageCache = imageCache;
    }

    // Services methods
    async getNextPlan(serviceTypeId) {
        try {
            const upcomingResp = await this.client.get(
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
            console.error("Tried fetching from URL:", `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?filter=future&order=sort_date&per_page=1`);
            throw err;
        }
    }

    // Services methods
    async getNewestPlan(serviceTypeId) {
        try {
            const upcomingResp = await this.client.get(
                `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?order=-sort_date&per_page=1`
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
            console.error("Tried fetching from URL:", `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?order=-sort_date&per_page=1`);
            throw err;
        }
    }

    async getNewestPlans(serviceTypeId, num = 10, offset = 0) {
        try {
            if(num > 15)
                console.warn("Planning Center API limits the number of plans returned to 15. Requested:", num);
            const resp = await this.client.get(
                `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?order=-sort_date&per_page=${num}${offset > 0 ? `&page=${offset}` : ''}`
            );

            const plans = Array.isArray(resp.data) && resp.data;
            if (!plans) {
                console.log(`No upcoming plans found for service type ${serviceTypeId}`);
                return null;
            }

            return plans.map(plan => ({
                id: plan.id,
                title: plan.attributes?.title,
                type: plan.type,
                attributes: plan.attributes,
                rawData: plan
            }));
        } catch (err) {
            console.error('Error fetching next plan:', err.message);
            console.error("Tried fetching from URL:", `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans?order=-sort_date&per_page=1`);
            throw err;
        }
    }

    async getPlan(serviceTypeId, planId) {
        try {
            const resp = await this.client.get(
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

    // Team methods
    async getTeamMembers(serviceTypeId, planId) {
        try {
            const teamResp = await this.client.get(
                `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans/${planId}/team_members?per_page=100`
            );

            const members = Array.isArray(teamResp.data)
                ? teamResp.data
                    .filter(p => p.attributes?.status === 'C')
                    .map(p => this.formatTeamMember(p))
                : [];

            return members;
        } catch (err) {
            console.error('Error fetching team members:', err.message);
            throw err;
        }
    }

    formatTeamMember(rawMember) {
        return {
            id: rawMember.relationships.person.data.id,
            name: rawMember.attributes?.name,
            status: rawMember.attributes?.status,
            team_position_name: rawMember.attributes?.team_position_name,
            photo_thumbnail_url: this.enhancePhotoUrl(rawMember.attributes?.photo_thumbnail),
            rawData: rawMember
        };
    }

    enhancePhotoUrl(photoUrl) {
        if (!photoUrl) return null;
        return photoUrl.replace("?g=224x224%23", "?g=512x512%23");
    }

    async getScheduledTeam(serviceTypeId, planId) {
        const members = await this.getTeamMembers(serviceTypeId, planId);
        const scheduled = members.filter(m => m.status === 'C');
        return scheduled;
    }

    /**
     * Cache profile images for an array of team members
     * @param {Array} teamMembers - Array of team member objects with photo_thumbnail_url
     */
    async cacheTeamImages(teamMembers) {
        if (!Array.isArray(teamMembers)) {
            console.warn('cacheTeamImages expects an array of team members');
            return;
        }

        for (const member of teamMembers) {
            if (member.photo_thumbnail_url) {
                await this.imageCache.cache(member.photo_thumbnail_url);
            }
        }
    }
}
