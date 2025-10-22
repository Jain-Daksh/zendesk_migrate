const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

async function fetchZendeskUsers(pageUrl) {
  try {
    const res = await axios.get(pageUrl, {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });

    console.log('Fetched users:', typeof res.data.users, res.data.users ? res.data.users.length : 0);

    const agents = (res.data.users || []).filter((user) => user.role === 'agent');
    const nextPage = res.data.next_page;  
    return { agents, nextPage }; 
  } catch (error) {
    console.error('Error fetching Zendesk users:', error);
    return { agents: [], nextPage: null }; 
  }
}

async function fetchAllUsers() {
  let allUsers = [];
  let pageUrl = `${ZENDESK_DOMAIN}/users.json`;  

  console.log('⏳ Fetching all users...');

  while (pageUrl) {
    const { agents, nextPage } = await fetchZendeskUsers(pageUrl); 

    if (agents.length > 0) {
      allUsers = [...allUsers, ...agents];  
    }

    pageUrl = nextPage;  
  }

  fs.writeFileSync('all_agents_for_verification.json', JSON.stringify(allUsers, null, 2));

  console.log(`✅ Saved ${allUsers.length} agents for verification.`);
}

fetchAllUsers();
