const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

const FRESHDESK_DOMAIN = 'woodenstreet891328299873.freshdesk.com';
const FRESHDESK_API_KEY = 'QrLHtXvwWp019684SZG';

// async function fetchZendeskUsers(
//   pageUrl = `${ZENDESK_DOMAIN}/users.json`
// ) {
//   const res = await axios.get(pageUrl, {
//     auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
//   });

//   const users = res.data.users;
//   // if (res.data.next_page) {
//   //   const next = await fetchZendeskUsers(res.data.next_page);
//   //   return [...users, ...next];
//   // }
//   return users;
// }

async function fetchZendeskUsers(pageUrl) {
  const res = await axios.get(pageUrl, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });

  const users = res.data.users;
  const nextPage = res.data.next_page; // URL for next page, if available
  return { users, nextPage };
}
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

async function createFreshdeskCompany(org) {
  try {
    const data = {
      name: org.name || 'Unnamed Organization',
      description: org.details || '',
    };

    const res = await axios.post(`${FRESHDESK_DOMAIN}/api/v2/companies`, data, {
      auth: { username: FRESHDESK_API_KEY, password: 'X' },
    });

    console.log(`🏢 Created company: ${res.data.name} (${res.data.id})`);
    return res.data.id;
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`⚠️ Company already exists: ${org.name}`);
      return null;
    }
    console.error(
      `❌ Failed to create company ${org.name}:`,
      err.response?.data || err.message
    );
    return null;
  }
}

async function createFreshdeskContact(user, orgMap) {
  try {
    const data = {
      name: user.name || 'Unnamed Contact',
      email: user.email || `user${user.id}@example.com`,
      phone: (user.phone ?? user.shared_phone_number)  || undefined,
      company_id: user.organization_id
        ? orgMap[user.organization_id] // Map Zendesk organization ID to Freshdesk company ID
        : undefined,
      zendesk_id: user.id, // Store the Zendesk user ID in Freshdesk's custom field
      tags: user.tags || [], // Include tags if available
    };

    console.log('data', data);
return true
    // Send request to Freshdesk to create the contact
    const res = await axios.post(`${FRESHDESK_DOMAIN}/api/v2/contacts`, data, {
      auth: { username: FRESHDESK_API_KEY, password: 'X' },
    });

    console.log(`👤 Created contact: ${res.data.name} (${res.data.id})`);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`⚠️ Contact already exists: ${user.email}`);
      return;
    }
    console.error(
      `❌ Failed to create contact for ${user.email}:`,
      err.response?.data || err.message
    );
  }
}

// ---------------------------
// MAIN FLOW
// ---------------------------

async function migrateContacts() {
  console.log('⏳ Fetching Zendesk users...');
  // Fetch only the first page (with a limit of 1)
  // const users = await fetchZendeskUsers(
  //   `${ZENDESK_DOMAIN}/users.json?per_page=1`
  // );
  const { users: page1Users, nextPage: nextPage1 } = await fetchZendeskUsers(
    `${ZENDESK_DOMAIN}/users.json`
  );

  // if (nextPage1) {
  //   return console.log('Only fetching first page for testing');
  // }
  console.log(`Found ${page1Users} user.`);

  const selectedContacts = [...page1Users];

  // Log users data to a backup file
  fs.writeFileSync(
    'zendesk_users_backup.json',
    JSON.stringify(selectedContacts, null, 2)
  );

  // Fetch organizations mapping (if needed)
  // const orgs = await fetchZendeskOrganizations();
  // const orgMap = {}; // This part would be used if migrating organizations as well

  // For now, process the first user
  for (const user of selectedContacts) {
    console.log('Processing user:', user);

    // Create the Freshdesk contact
    await createFreshdeskContact(user, {}); // Pass an empty orgMap for now
  }
  // console.log('Processing user:', user);

  // Create the Freshdesk contact
  // await createFreshdeskContact(user, {}); // Pass an empty orgMap for now

  console.log('✅ Contact migration completed!');
}

// async function migrateContacts() {
//   console.log('⏳ Fetching Zendesk organizations...');
//   // const orgs = await fetchZendeskOrganizations();
//   // console.log(`Found ${orgs.length} organizations.`);

//   // const orgMap = {};
//   // for (const org of orgs) {
//   //   const companyId = await createFreshdeskCompany(org);
//   //   if (companyId) orgMap[org.id] = companyId;
//   // }

//   console.log('⏳ Fetching Zendesk users...');
//   const users = await fetchZendeskUsers();
//   console.log(`Found ${users.length} users.`);

//   fs.writeFileSync('zendesk_users_backup.json', JSON.stringify(users, null, 2));

//   // console.log('🚀 Creating contacts in Freshdesk...');
//   // for (const user of users) {
//   //   if (user.role === 'end-user') {
//   //     await createFreshdeskContact(user, orgMap);
//   //   }
//   // }

//   console.log('✅ Contact migration completed!');
// }

migrateContacts();
