const axios = require('axios');
const fs = require('fs');
// import got from 'got';
const got = require('got');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

const FRESHDESK_DOMAIN = 'woodenstreet891328299873.freshdesk.com';
const FRESHDESK_API_KEY = 'QrLHtXvwWp019684SZG';

// ---------------------------
// Fetch all Zendesk users (contacts/customers)
// ---------------------------
async function fetchZendeskUsers(pageUrl = `${ZENDESK_DOMAIN}/users.json`) {
  const res = await axios.get(`${ZENDESK_DOMAIN}/users.json`, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    params: {
      per_page: 1, // Limit to 1 user
      page: 1, // Fetch the first page
    },
  });
  console.log('res', res.data.count);

  return res.data.users[0];
  if (res.data.next_page) {
    const next = await fetchZendeskUsers(res.data.next_page);
    return [...users, ...next];
  }
  return users;
}

// ---------------------------
// Fetch all Zendesk organizations
// ---------------------------
async function fetchZendeskOrganizations(
  pageUrl = `${ZENDESK_DOMAIN}/organizations.json`
) {
  const res = await axios.get(pageUrl, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });

  const orgs = res.data.organizations;
  if (res.data.next_page) {
    const next = await fetchZendeskOrganizations(res.data.next_page);
    return [...orgs, ...next];
  }
  return orgs;
}

// ---------------------------
// Create company in Freshdesk
// ---------------------------
async function createFreshdeskCompany(org) {
  try {
    const data = {
      name: org.name || 'Unnamed Organization',
      description: org.details || '',
    };
    const res = await axios.post(
      `https://woodenstreet891328299873.freshdesk.com/api/v2/companies`,
      data,
      {
        auth: { username: FRESHDESK_API_KEY, password: 'X' },
      }
    );
    console.log(`🏢 Created company: ${res.data.name} (${res.data.id})`);
    return res.data.id;
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`⚠️ Company already exists: ${org.name}`);
      return null;
    }
    console.error(
      `❌ Failed to create company ${org.name}:`,
      err,
      err.response?.data || err.message
    );
    return null;
  }
}

async function createFreshdeskContact(user, orgMap) {
  console.log('users', user);
  try {
    const customFields = {
      zendesk_id: String(user.id), // Custom field for zendesk_id
    };

    const data = {
      name: user.name || 'Unnamed Contact',
      email: user.email || `user${user.id}@example.com`,
      phone: (user.phone ?? user.shared_phone_number) || undefined,
      // company_id: user.organization_id
      //   ? orgMap[user.organization_id]
      //   : undefined,
      custom_fields: customFields,
      tags: user.tags || [],
      active: true,
      view_all_tickets: false,
    };
    console.log('data', data);
    const res = await axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/contacts`,
      data,
      {
        auth: { username: FRESHDESK_API_KEY, password: 'X' },
      }
    );

    console.log(`👤 Created contact: ${res.data.name} (${res.data.id})`);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`⚠️ Contact already exists: ${user.email}`);
      return;
    }
    console.error(
      `❌ Failed contact ${user.email}:`,
      err.response?.data || err.message
    );
  }
}

// ---------------------------
// MAIN FLOW
// ---------------------------
// async function migrateContacts() {
//   console.log('⏳ Fetching Zendesk users...');
//   const users = await fetchZendeskUsers();
//   console.log(`Found ${users.length} users.`);

//   // fs.writeFileSync("zendesk_users_backup.json", JSON.stringify(users, null, 2));

//   console.log('🚀 Creating contacts in Freshdesk...');
//   for (const user of users) {
//     // if (user.role === 'end-user') {
//       await createFreshdeskContact(user, orgMap);
//     // }
//   }

//   console.log('✅ Contact migration completed!');
// }

// migrateContacts();

async function migrateOneContact() {
  const user = await fetchZendeskUsers();

  console.log('fetched user', user);
  const testUser = user;
  console.log('🧐 Testing with the user: ', testUser);

  console.log('🚀 Creating contact in Freshdesk for testing...');
  await createFreshdeskContact(testUser);

  console.log('✅ Test contact migration completed!');
}

migrateOneContact();
