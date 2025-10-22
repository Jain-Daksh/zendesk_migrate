const axios = require('axios');
const fs = require('fs');

const ZENDESK_DOMAIN = 'https://wsteamsupport.zendesk.com/api/v2/';
const ZENDESK_EMAIL = 'admin@woodenstreet.com';
const ZENDESK_TOKEN = 'QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr';

async function fetchAllZendeskCustomFields(url) {
  let customFields = [];
  let pageUrl = url || `${ZENDESK_DOMAIN}user_fields.json`; // Default to user fields

  try {
    while (pageUrl) {
      // Make the API call to fetch user or ticket fields
      const res = await axios.get(pageUrl, {
        auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
      });

      // Combine the fetched fields (user fields or ticket fields) into the customFields array
      customFields = customFields.concat(
        res.data.user_fields || res.data.ticket_fields
      );

      // Pagination: If there’s a next page, continue fetching
      pageUrl = res.data.next_page;
    }

    // Extract only name and type for each custom field
    const fieldsSummary = customFields.map((field) => ({
      title: field.title,
      type: field.type,
    }));

    // Log the output or save it to a file
    console.log(
      'Custom Fields (Name & Type):',
      JSON.stringify(fieldsSummary, null, 2)
    );

    // Optionally, write the result to a file for backup
    fs.writeFileSync(
      'zendesk_custom_fields.json',
      JSON.stringify(fieldsSummary, null, 2)
    );

    return fieldsSummary;
  } catch (err) {
    console.error(
      'Error fetching Zendesk custom fields:',
      err.response?.data || err.message
    );
    return [];
  }
}

// Fetch all user custom fields
fetchAllZendeskCustomFields(`${ZENDESK_DOMAIN}user_fields.json`);

// Fetch all ticket custom fields (can be used as an alternative or added to the above)
fetchAllZendeskCustomFields(`${ZENDESK_DOMAIN}ticket_fields.json`);
