// const axios = require("axios")
// const fs = require('fs')
// const ZENDESK_DOMAIN = "https://wsteamsupport.zendesk.com/api/v2/";
// const ZENDESK_EMAIL = "admin@woodenstreet.com";
// const ZENDESK_TOKEN = "QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr";

// async function fetchZendeskUsers(pageUrl = `${ZENDESK_DOMAIN}/users.json`) {
//   const res = await axios.get(pageUrl, {
//     auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
//   });

//   const users = res.data.users;
//   if (res.data.next_page) {
//     const next = await fetchZendeskUsers(res.data.next_page);
//     return [...users, ...next];
//   }
//   return users;
// }

// async function fetchZendeskOrganizations(pageUrl = `${ZENDESK_DOMAIN}/api/v2/organizations.json`) {
//   const res = await axios.get(pageUrl, {
//     auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
//   });

//   const orgs = res.data.organizations;
//   if (res.data.next_page) {
//     const next = await fetchZendeskOrganizations(res.data.next_page);
//     return [...orgs, ...next];
//   }
//   return orgs;
// }

// function getRandomContacts(users, count = 20) {
//   const shuffled = users.sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, count);
// }

// async function fetchAndVerify() {
//   console.log("⏳ Fetching Zendesk organizations...");
//   // const orgs = await fetchZendeskOrganizations();
//   // console.log(`Found ${orgs.length} organizations.`);

//   console.log("⏳ Fetching Zendesk users...");
//   const users = await fetchZendeskUsers();
//   console.log(`Found ${users.length} users.`);

//   // Get 20 random users for verification
//   const randomContacts = getRandomContacts(users, 20);

//   fs.writeFileSync("zendesk_users_backup.json", JSON.stringify(users, null, 2));

//   console.log("📝 Sample of 20 random contacts to verify data: ");
//   // console.log(JSON.stringify(randomContacts, null, 2));

//   console.log("✅ All done! Please verify the sample data.");
// }

// fetchAndVerify();
const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

// Fetch organizations from Zendesk
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

// Fetch users from a given page
async function fetchZendeskUsers(pageUrl) {
  const res = await axios.get(pageUrl, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });

  const users = res.data.users;
  const nextPage = res.data.next_page; // URL for next page, if available
  return { users, nextPage };
}

// Function to fetch contact info from both page 1 and page 3
async function fetchContactsAndOrganizations() {
  // Fetch organizations
  console.log('⏳ Fetching organizations...');
  let org = await fetchZendeskOrganizations();

  // Fetch page 1 of users
  console.log('⏳ Fetching users from page 1...');
  const { users: page1Users, nextPage: nextPage1 } = await fetchZendeskUsers(
    `${ZENDESK_DOMAIN}/users.json`
  );

  // Fetch page 3 of users, if available
  let page3Users = [];
  if (nextPage1) {
    console.log('⏳ Fetching users from page 3...');
    const { users: page2Users, nextPage: nextPage2 } = await fetchZendeskUsers(
      nextPage1
    ); // Fetch next page (page 2)

    if (nextPage2) {
      // Now we fetch page 3
      const { users: page3 } = await fetchZendeskUsers(nextPage2);
      page3Users = page3;
    }
  }

  // Combine contacts from both pages
  const selectedContacts = [...page1Users, ...page3Users];

  // Save the organization data into a JSON file
  fs.writeFileSync('zendesk_organizations.json', JSON.stringify(org, null, 2));

  // Save the selected contacts data into a JSON file
  fs.writeFileSync(
    'selected_contacts_for_verification.json',
    JSON.stringify(selectedContacts, null, 2)
  );

  console.log(
    `✅ Saved ${selectedContacts.length} contacts from page 1 and page 3 for verification.`
  );
  console.log(`✅ Saved ${org.length} organizations for verification.`);
}

fetchContactsAndOrganizations();

async function fetchZendeskTickets(pageUrl = `${ZENDESK_DOMAIN}/tickets.json`) {
  const res = await axios.get(pageUrl, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });

  const tickets = res.data.tickets;
  const nextPage = res.data.next_page; // URL for next page, if available
  return { tickets, nextPage };
}

// Fetch comments for a specific ticket
async function fetchTicketComments(ticketId) {
  const res = await axios.get(
    `${ZENDESK_DOMAIN}/tickets/${ticketId}/comments.json`,
    {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    }
  );

  return res.data.comments;
}

// Fetch attachments for a specific comment
async function fetchAttachmentsForComment(ticketId, commentId) {
  const res = await axios.get(
    `${ZENDESK_DOMAIN}/tickets/${ticketId}/comments/${commentId}/attachments.json`,
    {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    }
  );

  return res.data.attachments;
}

// Function to fetch ticket data, including comments and attachments
async function fetchTicketsWithConversationsAndAttachments() {
  let allTickets = [];

  // Fetch page 1 of tickets
  console.log('⏳ Fetching tickets from page 1...');
  const { tickets: page1Tickets, nextPage: nextPage1 } =
    await fetchZendeskTickets(`${ZENDESK_DOMAIN}/tickets.json`);

  // Get comments and attachments for each ticket
  for (const ticket of page1Tickets) {
    console.log(`⏳ Fetching comments for ticket ID: ${ticket.id}`);
    const comments = await fetchTicketComments(ticket.id);

    // Fetch attachments for each comment
    const commentsWithAttachments = [];
    for (const comment of comments) {
      // const attachments = await fetchAttachmentsForComment(ticket.id, comment.id);
      commentsWithAttachments.push({ ...comment });
    }

    allTickets.push({ ...ticket, comments: commentsWithAttachments });
  }

  // If there is a next page, fetch page 2 and repeat the process
  if (nextPage1) {
    console.log('⏳ Fetching tickets from page 2...');
    const { tickets: page2Tickets, nextPage: nextPage2 } =
      await fetchZendeskTickets(nextPage1);

    // Get comments and attachments for page 2 tickets
    for (const ticket of page2Tickets) {
      console.log(`⏳ Fetching comments for ticket ID: ${ticket.id}`);
      // const comments = await fetchTicketComments(ticket.id);

      const commentsWithAttachments = [];
      // for (const comment of comments) {
      //   const attachments = await fetchAttachmentsForComment(ticket.id, comment.id);
      //   commentsWithAttachments.push({ ...comment, attachments });
      // }

      allTickets.push({ ...ticket, comments: commentsWithAttachments });
    }
  }

  // Save the tickets data into a JSON file
  fs.writeFileSync(
    'zendesk_tickets_with_conversations_and_attachments.json',
    JSON.stringify(allTickets, null, 2)
  );
  console.log(
    `✅ Saved ${allTickets.length} tickets with conversations and attachments.`
  );
}

fetchTicketsWithConversationsAndAttachments();

async function fetchZendeskAgents() {
  let agents = [];
  let pageUrl = `${ZENDESK_DOMAIN}/users.json`;
  let nextPage;

  do {
    console.log('⏳ Fetching users...');
    const { users, nextPage: next } = await fetchZendeskUsers(pageUrl);
    nextPage = next;

    // Filter agents from the list of users
    const pageAgents = users.filter((user) => user.role === 'agent');
    agents = [...agents, ...pageAgents];

    pageUrl = nextPage; // Update the URL for the next page, if any
  } while (nextPage);

  // Save the agent data into a JSON file
  fs.writeFileSync('zendesk_agents.json', JSON.stringify(agents, null, 2));
  console.log(`✅ Saved ${agents.length} agents.`);
}
fetchZendeskAgents();

console.log('✅ All done!');
