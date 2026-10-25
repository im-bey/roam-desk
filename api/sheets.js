const { google } = require("googleapis");
const ALLOWED = new Set(["13s7Ng4OrLFa_A0tkZMjMXSvvx0Z2CgBOaHhrlfVsxxk", "1oO3O6kdzqA7BmNq7hWlxQTOi3XOrTKhMyvpPVFglPJ8"]);
let client;
function sheets() {
  if (!client) {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    client = google.sheets({ version: "v4", auth });
  }
  return client;
}
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.DASH_PASSWORD || req.headers["x-dash-key"] !== process.env.DASH_PASSWORD) return res.status(401).json({ error: "unauthorised" });
  try {
    const { slug, args = {} } = req.body || {};
    const id = args.spreadsheet_id || args.spreadsheetId;
    if (!ALLOWED.has(id)) return res.status(400).json({ error: "sheet not allowed" });
    const s = sheets().spreadsheets.values;
    let out;
    if (slug === "GOOGLESHEETS_BATCH_GET") {
      const r = await s.batchGet({ spreadsheetId: id, ranges: args.ranges, valueRenderOption: args.valueRenderOption || "FORMATTED_VALUE" });
      out = { valueRanges: r.data.valueRanges };
    } else if (slug === "GOOGLESHEETS_VALUES_UPDATE") {
      const r = await s.update({ spreadsheetId: id, range: args.range, valueInputOption: args.value_input_option || "RAW", requestBody: { values: args.values } });
      out = r.data;
    } else if (slug === "GOOGLESHEETS_UPDATE_VALUES_BATCH") {
      const r = await s.batchUpdate({ spreadsheetId: id, requestBody: { valueInputOption: args.valueInputOption || "RAW", data: args.data } });
      out = r.data;
    } else if (slug === "GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND") {
      const r = await s.append({ spreadsheetId: id, range: args.range, valueInputOption: args.valueInputOption || "RAW", insertDataOption: args.insertDataOption || "INSERT_ROWS", requestBody: { values: args.values } });
      out = r.data;
    } else return res.status(400).json({ error: "unknown call" });
    res.status(200).json({ data: out });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
