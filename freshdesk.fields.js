const axios = require('axios');
const fs = require('fs');

const FRESHDESK_DOMAIN = 'woodenstreet891328299873.freshdesk.com';
const FRESHDESK_API_KEY = 'QrLHtXvwWp019684SZG';

// Function to fetch custom fields (Contact or Ticket)
async function fetchFreshdeskCustomFields(url) {
  let customFields = [];
  // https://${FRESHDESK_DOMAIN}/api/v2/
  let pageUrl = `https://${FRESHDESK_DOMAIN}/api/v2/ticket_fields`;  // Default to contact fields

  try {
    while (pageUrl) {
      // Make the API call to fetch contact or ticket fields
      const res = await axios.get(pageUrl, {
        auth: { username: FRESHDESK_API_KEY, password: 'X' }
      });

      // Combine the fetched fields (contact fields or ticket fields) into the customFields array
      customFields = customFields.concat(res.data);

      // Pagination: If there’s a next page, continue fetching
      pageUrl = res.headers['link'] && res.headers['link'].includes('rel="next"')
        ? `${FRESHDESK_DOMAIN}${res.headers['link'].split(';')[0].slice(1, -1)}`
        : null;
    }

    // Extract only name and type for each custom field
    const fieldsSummary = customFields.map(field => ({
      name: field.name,
      type: field.type,
    }));

    // Log the output or save it to a file
    console.log('Custom Fields (Name & Type):', JSON.stringify(fieldsSummary, null, 2));

    // Optionally, write the result to a file for backup
    fs.writeFileSync('freshdesk_custom_fields.json', JSON.stringify(fieldsSummary, null, 2));

    return fieldsSummary;
  } catch (err) {
    console.error('Error fetching Freshdesk custom fields:', err.response?.data || err.message);
    return [];
  }
}

// Fetch all contact custom fields
fetchFreshdeskCustomFields(`${FRESHDESK_DOMAIN}/api/v2/ticket_fields`);

// Fetch all ticket custom fields (can be used as an alternative or added to the above)
// fetchFreshdeskCustomFields(`${FRESHDESK_DOMAIN}/api/v2/fields/tickets`);
