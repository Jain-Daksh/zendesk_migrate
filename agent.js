const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

// Function to fetch users
async function fetchZendeskUsers(pageUrl) {
  try {
    const res = await axios.get(pageUrl, {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });

    // Log the type and length of res.data.users to help debug
    console.log('res.data.users', typeof res.data.users, res.data.users ? res.data.users.length : 0);

    // Filter agents and handle potential issues with undefined or null
    const agents = (res.data.users || []).filter((user) => user.role === 'agent');
    const nextPage = res.data.next_page;  // URL for next page, if available

    return { agents, nextPage };  // Ensure agents is always an array
  } catch (error) {
    console.error('Error fetching Zendesk users:', error);
    return { agents: [], nextPage: null };  // Return empty array in case of error
  }
}

// Function to fetch agents from pages 1 and 3
async function fetchContactsAndOrganizations() {
  console.log('⏳ Fetching users from page 1...');

  // Fetch users from page 1
  const { agents: page1Users, nextPage: nextPage1 } = await fetchZendeskUsers(
    `${ZENDESK_DOMAIN}/users.json`
  );

  // Log to ensure data is returned correctly for page 1
  console.log('Fetched page 1 users:', page1Users.length);

  // Fetch page 3 of users if available
  let page3Users = [];
  if (nextPage1) {
    console.log('⏳ Fetching users from page 3...');
    const { agents: page2Users, nextPage: nextPage2 } = await fetchZendeskUsers(nextPage1); // Fetch page 2

    if (nextPage2) {
      // Now we fetch page 3
      const { agents: page3 } = await fetchZendeskUsers(nextPage2);
      page3Users = page3;
    }
  }

  // Combine contacts from both pages (ensure they're arrays)
  const selectedContacts = [...page1Users, ...page3Users];

  // Save the selected contacts into a JSON file
  fs.writeFileSync(
    'selected_agent_for_verification.json',
    JSON.stringify(selectedContacts, null, 2)
  );

  console.log(`✅ Saved ${selectedContacts.length} agents for verification.`);
}

fetchContactsAndOrganizations();
