const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

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

  const comments = res.data.comments.map((comment) => ({
    id: comment.id,
    author_id: comment.author_id,
    created_at: comment.created_at,
    body: comment.body,
    public: comment.public,
    type: comment.public ? 'public' : 'private',
    attachments: comment.attachments?.map((a) => ({
      id: a.id,
      file_name: a.file_name,
      content_url: a.content_url,
      content_type: a.content_type,
      size: a.size,
    })),
  }));

  return comments;
}

async function fetchTicketsWithNotes() {
  let allTickets = [];
  let pageUrl = `${ZENDESK_DOMAIN}/tickets.json`;
  let pageCount = 1;

  while (pageUrl) {
    console.log(`⏳ Fetching tickets from page ${pageCount}...`);
    const { tickets, nextPage } = await fetchZendeskTickets(pageUrl);

    for (const ticket of tickets) {
      console.log(`📝 Fetching comments for ticket ID: ${ticket.id}`);
      const comments = await fetchTicketComments(ticket.id);

      const publicNotes = comments.filter((c) => c.public);
      const privateNotes = comments.filter((c) => !c.public);

      allTickets.push({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        requester_id: ticket.requester_id,
        assignee_id: ticket.assignee_id,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        tags: ticket.tags,
        custom_fields: ticket.custom_fields,
        public_notes: publicNotes,
        private_notes: privateNotes,
      });
    }

    // move to next page
    pageUrl = nextPage;
    pageCount++;
  }

  fs.writeFileSync(
    'zendesk_tickets_with_notes.json',
    JSON.stringify(allTickets, null, 2)
  );
  console.log(
    `✅ Saved ${allTickets.length} tickets with notes (public + private).`
  );
}

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
fetchTicketsWithNotes()