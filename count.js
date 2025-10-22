const axios = require('axios');
const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

// Fetch only the count of Zendesk users
async function fetchZendeskUserCount() {
  try {
    const res = await axios.get(`${ZENDESK_DOMAIN}/users.json`, {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });
    // Return the total count of users
    return res.data.count;
  } catch (error) {
    console.error('Error fetching users count:', error);
    return 0; // Return 0 in case of an error
  }
}

// Fetch only the count of Zendesk organizations
async function fetchZendeskOrgCount() {
  try {
    const res = await axios.get(`${ZENDESK_DOMAIN}/organizations.json`, {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });
    // Return the total count of organizations
    return res.data.count;
  } catch (error) {
    console.error('Error fetching organizations count:', error);
    return 0; // Return 0 in case of an error
  }
}

// Fetch only the count of Zendesk tickets
async function fetchZendeskTicketCount() {
  try {
    const res = await axios.get(`${ZENDESK_DOMAIN}/tickets.json`, {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });
    // Return the total count of tickets
    return res.data.count;
  } catch (error) {
    console.error('Error fetching tickets count:', error);
    return 0; // Return 0 in case of an error
  }
}

async function fetchAndVerify() {
  console.log('⏳ Fetching Zendesk organizations count...');
  const orgCount = await fetchZendeskOrgCount();
  console.log(`Found ${orgCount} organizations.`);

  console.log('⏳ Fetching Zendesk users count...');
  const userCount = await fetchZendeskUserCount();
  console.log(`Found ${userCount} users.`);

  console.log('⏳ Fetching Zendesk tickets count...');
  const ticketCount = await fetchZendeskTicketCount();
  console.log(`Found ${ticketCount} tickets.`);

  console.log('✅ All done! You can now verify the counts.');
}

fetchAndVerify();
