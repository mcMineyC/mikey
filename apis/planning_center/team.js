/**
 * Planning Center Team API module
 * Handles team member data
 */

export async function getTeamMembers(client, serviceTypeId, planId) {
    try {
        const teamResp = await client.get(
            `https://api.planningcenteronline.com/services/v2/service_types/${serviceTypeId}/plans/${planId}/team_members?per_page=100`
        );

        const members = Array.isArray(teamResp.data)
            ? teamResp.data
                .filter(p => p.attributes?.status === 'C')
                .map(p => formatTeamMember(p))
            : [];

        return members;
    } catch (err) {
        console.error('Error fetching team members:', err.message);
        throw err;
    }
}

export function formatTeamMember(rawMember) {
    return {
        id: rawMember.id,
        name: rawMember.attributes?.name,
        status: rawMember.attributes?.status,
        team_position_name: rawMember.attributes?.team_position_name,
        photo_thumbnail_url: enhancePhotoUrl(rawMember.attributes?.photo_thumbnail),
        rawData: rawMember
    };
}

function enhancePhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    return photoUrl.replace("?g=224x224%23", "?g=512x512%23");
}

export async function getScheduledTeam(client, serviceTypeId, planId) {
    const members = await getTeamMembers(client, serviceTypeId, planId);
    return members.filter(m => m.status === 'C');
}
