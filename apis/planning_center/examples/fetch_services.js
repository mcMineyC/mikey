import { createClientFromEnv } from '../planning_center.js'

// Example: fetch past services up to yesterday, and upcoming services from today
const client = createClientFromEnv();

function isoDate(d) { return d.toISOString(); }

const now = new Date();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

async function fetchServiceDates() {
  try {
    console.log('Fetching past service dates (through yesterday)...');
    const past = await client.get('/services/v2/service_dates', { params: { end: isoDate(yesterday) } });
    console.log('Past results:', JSON.stringify(past, null, 2));

    console.log('Fetching upcoming service dates (from today)...');
    const upcoming = await client.get('/services/v2/service_dates', { params: { start: isoDate(now) } });
    console.log('Upcoming results:', JSON.stringify(upcoming, null, 2));
  } catch (err) {
    console.error('Error fetching service dates:', err.status || err.message, err.body || err);
    process.exitCode = 1;
  }
}

fetchServiceDates();
