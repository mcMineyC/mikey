// Simple Planning Center API client (Personal Access Token / Basic Auth)
// Usage:
// import { PlanningCenterClient, createClientFromEnv } from './planning_center/planning_center.js'
// const client = createClientFromEnv();
// await client.get('/people/v2/people');

export class PlanningCenterClient {
	constructor({ clientId, clientSecret, userAgent, baseUrl } = {}) {
		// Support a single env var `PLANNING_CENTER_PAT` with format "client_id:secret"
		if (!clientId || !clientSecret) {
			const pat = process.env.PLANNING_CENTER_PAT;
			if (pat && pat.includes(':')) {
				const parts = pat.split(':');
				clientId = clientId || parts[0];
				clientSecret = clientSecret || parts[1];
			}
			clientId = clientId || process.env.PLANNING_CENTER_CLIENT_ID;
			clientSecret = clientSecret || process.env.PLANNING_CENTER_CLIENT_SECRET;
		}

		if (!clientId || !clientSecret) {
			throw new Error('Missing Planning Center PAT. Set PLANNING_CENTER_PAT or PLANNING_CENTER_CLIENT_ID and PLANNING_CENTER_CLIENT_SECRET in environment.');
		}

		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
		this.userAgent = userAgent || process.env.PLANNING_CENTER_USER_AGENT || 'mikey';
		this.base = baseUrl || process.env.PLANNING_CENTER_BASE_URL || 'https://api.planningcenteronline.com';
	}

	async request(path, { method = 'GET', params, body, headers = {} } = {}) {
		const url = new URL(path, this.base);
		if (params) {
			Object.entries(params).forEach(([k, v]) => {
				if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
			});
		}

		const reqHeaders = {
			Authorization: this.authHeader,
			'User-Agent': this.userAgent,
			Accept: 'application/json',
			...headers,
		};

		let bodyToSend = undefined;
		if (body !== undefined && body !== null) {
			if (body instanceof FormData) {
				bodyToSend = body;
			} else {
				reqHeaders['Content-Type'] = 'application/json';
				bodyToSend = JSON.stringify(body);
			}
		}

		if (typeof fetch !== 'function') {
			throw new Error('fetch is not available in this environment. Use Node 18+ or install a fetch polyfill (e.g. undici).');
		}

		const res = await fetch(url.toString(), {
			method,
			headers: reqHeaders,
			body: bodyToSend,
		});

		const text = await res.text();
		let data = null;
		try { data = text ? JSON.parse(text) : null; } catch { data = text; }

		if (!res.ok) {
			const err = new Error(`Planning Center API error ${res.status} ${res.statusText}`);
			err.status = res.status;
			err.body = data;
			throw err;
		}

		return data;
	}

	get(path, params) { return this.request(path, { method: 'GET', params }); }
	post(path, body) { return this.request(path, { method: 'POST', body }); }
	put(path, body) { return this.request(path, { method: 'PUT', body }); }
	delete(path) { return this.request(path, { method: 'DELETE' }); }
}

export function createClientFromEnv(opts = {}) {
	return new PlanningCenterClient(opts);
}

export default PlanningCenterClient;

