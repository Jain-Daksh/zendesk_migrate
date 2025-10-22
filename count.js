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
// Helper function to throttle requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch only the count of Zendesk agents with parallel requests
async function fetchZendeskAgentCount() {
  let agentCount = 0;
  let pageUrl = `${ZENDESK_DOMAIN}/users.json?role=agent&per_page=100`; // Limit to 100 per page
  let allPages = [];

  try {
    // Loop through all pages of users and count agents
    while (pageUrl) {
      allPages.push(
        axios.get(pageUrl, {
          auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
        })
      );

      if (allPages.length >= 10) {
        // Batch size: 10 concurrent requests at once
        // Wait for current batch to complete
        const results = await Promise.all(allPages);
        allPages = []; // Reset array for next batch

        // Count agents in the batch results
        results.forEach((res) => {
          const agentsOnPage = res.data.users.filter(
            (user) => user.role === 'agent'
          );
          agentCount += agentsOnPage.length;
        });

        // Add a small delay to throttle requests (to avoid hitting rate limits)
        await delay(1000); // Delay for 1 second after every batch
      }

      // Update pageUrl to the next page, if available
      const nextPage = (
        await axios.get(pageUrl, {
          auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
        })
      ).data.next_page;

      pageUrl = nextPage || null;
    }

    return agentCount; // Return the total count of agents
  } catch (error) {
    console.error('Error fetching agents count:', error);
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
  console.log('⏳ Fetching Zendesk agents count...');
  const agentCount = await fetchZendeskAgentCount();
  console.log(`Found ${agentCount} agents.`);
  console.log('✅ All done! You can now verify the counts.');
}

fetchAndVerify();
