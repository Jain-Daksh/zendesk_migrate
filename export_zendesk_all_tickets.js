const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

// issue mapping
const ISSUE_TYPE_MAP = {
  order_tracking___delivery: 'Order Tracking & Delivery',
  product_installation: 'Product Installation',
  invoice_related: 'Invoice related',
  payment_conflict: 'Payment Conflict',
  callback_request: 'CRM_Callback request',
  test_issue_type_1__order_cancel_: 'Test Issue Type 1 (Order cancel)',
  test_issue_type_2__invoice_queries_: 'Test Issue Type 2 (Invoice Queries)',
  defective_product_delivered__report_within_72_hours_:
    'Defective Product Delivered (Report Within 72 Hours)',
  different_product_received: 'Different Product Received',
  'order_cancellation/refund': 'Order Cancellation/Refund',
  warranty_claim_after_usage__after_72_hours_:
    'Post-Usage Warranty Claim (After 72 hours)',
  delivery_details_update: 'Delivery Details Update',
  'new_sales_/_purchase': 'New Sales / Purchase',
  abandoned_interaction: 'CRM_Abandoned Interaction',
  abandoned_call_request: 'Abandoned Call Request',
  'merchant_/vendor': 'Merchant /vendor',
  franchise: 'Franchise',
  collaboration: 'Collaboration',
  job_search: 'Job Search',
  'no_response_/_idle': 'No response / Idle',
  'advertisement_/_services': 'Advertisement / Services',
  product_installation_amazon: 'Product Installation Amazon',
  product_installation_flipkart: 'Product Installation Flipkart',
  customer_appreciation: 'Customer Appreciation',
  amazon_return: 'Amazon Return',
  flipkart_return: 'Flipkart Return',
  call_back_delay_orders: 'Callback Delay Orders',
};

// sub issue mapping 
const SUB_ISSUE_TYPE_MAP = {
  joints_open: 'Joints open',
  'alignment/dimension_issue': 'Alignment/Dimension issue',
  'crack/chip_off_issue': 'Crack/Chip off Issue',
  'wobbling/balancing': 'Wobbling/Balancing',
  missing_part: 'Missing Part',
  termite: 'Termite',
  channels_not_working: 'Channels not working',
  'dent/bent_issue': 'Dent/Bent Issue',
  broken_part: 'Broken Part',
  fabric_concern: 'Fabric Concern',
  wrong_polish_issues: 'Wrong Polish issues',
  'damaged_mirrors_/_glass': 'Damaged Mirrors / Glass',
  '24_hrs_cancellation': 'Within 24 Hrs cancellation',
  delay_delivery: 'Delay delivery',
  'duplicate_order/_double_payment': 'Duplicate Order/ Double payment',
  beyond_committed_timeline: 'Beyond Committed timeline',
  crm_delay_in_production: 'CRM_Delay in production',
  crm_lost_product_during_transit: 'CRM_Lost product during transit',
  crm_qc_failure: 'CRM_QC Failure',
  within_committed_timeline: 'Within Committed Timeline',
  'timeline_-_1_to_3_days': 'Timeline - 1 to 3 days',
  beyond_3_days: 'Beyond 3 days',
  crm_outskirt_location: 'CRM_Outskirt location',
  improper_installation_by_carpenter: 'Improper installation by Carpenter',
  no_cost_emi: 'No Cost EMI',
  discount_issues: 'Discount Issues',
  double_payments: 'Double payments',
  payment_failure: 'Payment failure',
  termite_issue: 'Termite issue',
  door_bent_issues: 'Door Bent Issues',
  polish_concerns: 'Polish concerns',
  hardware_issues: 'Hardware Issues',
  drawer_jam: 'Door/Drawer Jam',
  'billing_/_shipping_address_update': 'Billing / Shipping address update',
  'email_id_/_contact_number_updation': 'Email ID / Contact number Updation',
  invoice_copy_required: 'Invoice Copy Required',
  gst_number_update: 'GST Number Update',
  gst_returns: 'GST Returns',
  merchant_sub_issue: 'Merchant',
  'exchange_/_buyback_sub_issue': 'Exchange / Buyback',
  'timeline_-_1_to_4_days': 'Timeline - 1 to 4 days',
  beyond_4_days: 'Beyond 4 days',
  'no_response_/_idle_sub_issue': 'No response / Idle',
  franchise_sub_issue: 'Franchise',
  collaboration_sub_issue: 'Collaboration',
  job_search_sub_issue: 'Job Search',
  different_product_received1: 'Different Product Received',
  'new_sales_/_purchase1': 'New Sales / Purchase',
  'advertisement_/_services_sub_issue': 'Advertisement / Services',
  diy_: 'DIY',
  call_back_request: 'CRM_Call back request',
  abandoned_interaction_sub_issue: 'CRM_Abandoned interaction',
  abandoned_call_request_sub_issue: 'Abandoned call request',
  mattress_concern: 'Mattress Concern',
  'merchant__/vendor': 'Merchant /vendor',
  request_for_change_in_delivery_date: 'Request for change in delivery date',
  test__issue_type_1__order_cancel_: 'Test Issue Type 1 (Order cancel)',
  test__issue_type_2__invoice_queries_: 'Test Issue Type 2 (Invoice Queries)',
  customer_appreciation1: 'Customer Appreciation',
  'mattress_-_size_mismatch': 'Mattress - Size Mismatch',
  'mattress_-_sagging': 'Mattress - Sagging',
  'mattress_-_weak_edges': 'Mattress - Weak Edges',
  'mattress_-_comfort_mismatch': 'Mattress - Comfort Mismatch',
  fungus: 'Fungus',
  noise_issue: 'Noise issue',
  post_24_hours_cancellation: 'Post 24 Hours Cancellation',
  out_of_stock: 'Out of Stock',
};

//


function mapIssueTypeFields(ticket) {
  if (!ticket.custom_fields) return ticket;

  const mappedFields = ticket.custom_fields.map((field) => {
    if (typeof field.value === 'string' && ISSUE_TYPE_MAP[field.value]) {
      return {
        ...field,
        value: ISSUE_TYPE_MAP[field.value],
      };
    } else if (
      typeof field.value === 'string' &&
      SUB_ISSUE_TYPE_MAP[field.value]
    ) {
      return {
        ...field,
        value: SUB_ISSUE_TYPE_MAP[field.value],
      };
    }
    return field;
  });

  return {
    ...ticket,
    custom_fields: mappedFields,
  };
}

async function fetchZendeskTickets(pageUrl = `${ZENDESK_DOMAIN}/tickets.json`) {
  const res = await axios.get(pageUrl, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });
  return { tickets: res.data.tickets, nextPage: res.data.next_page };
}

async function fetchTicketComments(ticketId) {
  const res = await axios.get(
    `${ZENDESK_DOMAIN}/tickets/${ticketId}/comments.json`,
    {
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    }
  );

  return res.data.comments.map((comment) => ({
    id: comment.id,
    author_id: comment.author_id,
    created_at: comment.created_at,
    body: comment.body,
    public: comment.public,
    type: comment.public ? 'public' : 'private',
    attachments:
      comment.attachments?.map((a) => ({
        id: a.id,
        file_name: a.file_name,
        content_url: a.content_url,
        content_type: a.content_type,
        size: a.size,
      })) || [],
  }));
}

async function fetchAllTickets() {
  let allTickets = [];
  let pageUrl = `${ZENDESK_DOMAIN}/tickets.json`;
  let pageCount = 1;

  while (pageUrl) {
    console.log(`\n📄 Fetching tickets from page ${pageCount}...`);
    const { tickets, nextPage } = await fetchZendeskTickets(pageUrl);



    

    for (const ticket of tickets) {
      console.log(`📝 Fetching comments for ticket ID: ${ticket.id}`);
      const comments = await fetchTicketComments(ticket.id);

      const publicNotes = comments.filter((c) => c.public);
      const privateNotes = comments.filter((c) => !c.public);
      const mappedTicket = mapIssueTypeFields(ticket);

      allTickets.push({
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        requester_id: ticket.requester_id,
        assignee_id: ticket.assignee_id,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        tags: mappedTicket,
        custom_fields: ticket.custom_fields,
        public_notes: publicNotes,
        private_notes: privateNotes,
        attachments: [
          ...publicNotes.flatMap((n) => n.attachments),
          ...privateNotes.flatMap((n) => n.attachments),
        ],
      });
    }

    pageUrl = nextPage;
    pageCount++;
  }

  // Save unified export file
  fs.writeFileSync(
    'zendesk_full_export.json',
    JSON.stringify(allTickets, null, 2)
  );
  console.log(
    `\n✅ Export complete! Saved ${allTickets.length} tickets with all notes + attachments.`
  );
}

// fetchAllTickets().catch((err) => {
//   console.error(
//     '❌ Error fetching tickets:',
//     err.response?.data || err.message
//   );
// });
async function fetchSingleTicket(ticketId) {
  const res = await axios.get(`${ZENDESK_DOMAIN}/tickets/${ticketId}.json`, {
    auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
  });
  return res.data.ticket;
}
async function testSingleTicket() {
  try {
    const ticketId = 556169;
    console.log(`🎟 Fetching ticket ID: ${ticketId}...`);
    const ticket = await fetchSingleTicket(ticketId);
    const comments = await fetchTicketComments(ticketId);

    const publicNotes = comments.filter((c) => c.public);
    const privateNotes = comments.filter((c) => !c.public);

    const mappedTicket = mapIssueTypeFields(ticket);
    const exportData = {
      id: mappedTicket.id,
      subject: mappedTicket.subject,
      description: mappedTicket.description,
      status: mappedTicket.status,
      priority: mappedTicket.priority,
      requester_id: mappedTicket.requester_id,
      assignee_id: mappedTicket.assignee_id,
      created_at: mappedTicket.created_at,
      updated_at: mappedTicket.updated_at,
      tags: mappedTicket.tags,
      custom_fields: mappedTicket.custom_fields,
      public_notes: publicNotes,
      private_notes: privateNotes,
      attachments: [
        ...publicNotes.flatMap((n) => n.attachments),
        ...privateNotes.flatMap((n) => n.attachments),
      ],
    };

    fs.writeFileSync(
      `zendesk_ticket_${ticketId}.json`,
      JSON.stringify(exportData, null, 2)
    );

    console.log(`✅ Export complete! Saved to zendesk_ticket_${ticketId}.json`);
  } catch (err) {
    console.error(
      '❌ Error fetching ticket:',
      err.response?.data || err.message
    );
  }
}

testSingleTicket();
