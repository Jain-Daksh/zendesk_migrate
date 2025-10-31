const axios = require("axios");
const fs = require("fs");
const db = require("./db");
const path = require("path");
const os = require("os");

// 🔐 ENVIRONMENT CONFIG
const ZENDESK_DOMAIN = "https://wsteamsupport.zendesk.com/api/v2";
const ZENDESK_EMAIL = "admin@woodenstreet.com";
const ZENDESK_TOKEN = "QjtXjbwkXsk6mccLI1LYoATAuHP86ygP9nRAMjxr";

const FRESHDESK_DOMAIN = "woodenstreet891328299873.freshdesk.com";
const FRESHDESK_API_KEY = "QrLHtXvwWp019684SZG";

// ⚙️ Rate Limiting for Zendesk
const ZENDESK_RATE_LIMIT = 700;
const ZENDESK_INTERVAL = 60000 / ZENDESK_RATE_LIMIT;
let lastZendeskRequest = 0;

// 🧠 Helper - Respect Zendesk Rate Limits
async function zendeskRequest(config) {
  const now = Date.now();
  const waitTime = Math.max(0, ZENDESK_INTERVAL - (now - lastZendeskRequest));
  if (waitTime > 0) await new Promise((res) => setTimeout(res, waitTime));
  lastZendeskRequest = Date.now();

  try {
    return await axios(config);
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter =
        parseInt(error.response.headers["retry-after"]) * 1000 || 5000;
      console.warn(
        `⚠️ Rate limited by Zendesk. Retrying after ${retryAfter / 1000}s...`
      );
      await new Promise((res) => setTimeout(res, retryAfter));
      return zendeskRequest(config);
    }
    throw error;
  }
}

// 🔹 Get Zendesk Requester Details
async function getRequesterDetails(userId) {
  try {
    const res = await zendeskRequest({
      method: "get",
      url: `${ZENDESK_DOMAIN}/users/${userId}.json`,
      auth: { username: `${ZENDESK_EMAIL}/token`, password: ZENDESK_TOKEN },
    });
    return res.data.user;
  } catch (error) {
    console.error(
      "Error fetching requester:",
      error.response?.data || error.message
    );
    return null;
  }
}

// 🔹 Create Freshdesk Contact
const createContact = async (user) => {
  const customFields = { zendesk_id: String(user.id) };
  const data = {
    name: user.name || "Unnamed Contact",
    email: user.email || `user${user.id}@example.com`,
    phone: user.phone || user.shared_phone_number || undefined,
    custom_fields: customFields,
    tags: user.tags || [],
    active: true,
    view_all_tickets: false,
  };

  try {
    const res = await axios.post(
      `https://${FRESHDESK_DOMAIN}/api/v2/contacts`,
      data,
      {
        auth: { username: FRESHDESK_API_KEY, password: "X" },
      }
    );

    const uid = res.data.id;
    await db.query(
      "INSERT INTO contact_zendesk_freshdesk (zendesk_id, freshdesk_id) VALUES (?, ?)",
      [user.id, uid]
    );

    console.log(`✅ New contact created for Zendesk ID ${user.id}: ${uid}`);
    return uid;
  } catch (err) {
    if (err.response && err.response.status === 409) {
      const existingId =
        err.response.data?.errors?.[0]?.additional_info?.user_id;
      console.log(`⚠️ Contact already exists (UID: ${existingId})`);
      return existingId;
    } else {
      console.error("❌ Error creating contact:", err.message);
      throw err;
    }
  }
};

// 🔹 Fetch tickets from local JSON files and process requesters
async function fetchAllTickets() {
  const downloadsDir = path.join(__dirname, "downloads");

  // Read all files matching tickets_batch_3xxxxx.json
  const allFiles = fs
    .readdirSync(downloadsDir)
    .filter((f) => /^tickets_batch_3\d{5,}\.json$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

  console.log(`📂 Found ${allFiles.length} files to process`);

  for (const fileName of allFiles) {
    const filePath = path.join(downloadsDir, fileName);
    console.log(`\n📄 Processing file: ${fileName}`);

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const tickets = data.tickets || data.results || data.rows || data || [];

    console.log(`Found ${tickets.length} tickets in ${fileName}`);

    // Process each ticket’s requester
    for (const ticket of tickets) {
      const zendeskId = ticket.requester_id;
      if (!zendeskId) continue;

      // Check if user already exists in mapping DB
      const [existing] = await db.query(
        "SELECT * FROM contact_zendesk_freshdesk WHERE zendesk_id = ?",
        [zendeskId]
      );

      if (existing.length > 0) {
        console.log(`⏩ Skip - Zendesk ID ${zendeskId} already mapped`);
        continue;
      }

      console.log(`🔍 Fetching requester ${zendeskId} from Zendesk...`);
      const user = await getRequesterDetails(zendeskId);
      if (!user) {
        console.warn(`⚠️ Skipping Zendesk ID ${zendeskId} - not found`);
        continue;
      }

      // Create in Freshdesk
      await createContact(user);
    }

    // Log progress after each file
    fs.writeFileSync("progress2024.txt", `Completed file: ${fileName}`);
    fs.appendFileSync(
      "progress_log2024.txt",
      `✅ Completed: ${fileName}${os.EOL}`
    );

    console.log(`✅ Finished file: ${fileName}`);
  }

  console.log("🎉 All files processed successfully!");
}

// 🔹 Main Runner
async function main() {
  try {
    await fetchAllTickets();
    console.log("✅ Script complete.");
    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    console.error("💥 Script crashed:", err.message);
    process.exit(1);
  }
}

main();
