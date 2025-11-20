const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const pRetry = require("p-retry");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// pages we will try (root first)
const PATHS_TO_TRY = ["", "/", "/contact", "/contact-us", "/about", "/about-us", "/help", "/support"];

// common axios instance
const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  },
  maxRedirects: 5
});

async function fetchHtmlWithRetries(url) {
  return pRetry(() => axiosInstance.get(url).then(r => r.data), {
    retries: 2,
    factor: 1.5,
    minTimeout: 1000
  });
}

function extractEmailsFromHtml(html) {
  if (!html || typeof html !== "string") return [];
  // simple regex - captures most emails
  const matches = [...html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g)];
  return Array.from(new Set(matches.map(m => m[0])));
}

function normalizeUrl(input) {
  if (!input) return null;
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const u = new URL(url);
    // remove trailing slash for consistent concatenation
    u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString().replace(/\/$/, "");
  } catch (e) {
    return null;
  }
}

app.get("/", (req, res) => res.send("Email Scraper (axios+cheerio) is running"));

app.get("/api/fetch", async (req, res) => {
  try {
    const raw = req.query.url || req.query.u;
    if (!raw) return res.status(400).json({ error: "Missing ?url=" });

    const base = normalizeUrl(raw);
    if (!base) return res.status(400).json({ error: "Invalid URL" });

    const results = { url: base, emails: [], pages: [] };

    // try each path until we find emails
    for (const p of PATHS_TO_TRY) {
      const full = p === "" || p === "/" ? base : (base + (p.startsWith("/") ? p : "/" + p));
      try {
        const html = await fetchHtmlWithRetries(full);
        const emails = extractEmailsFromHtml(html);
        results.pages.push({ page: full, found: emails.length > 0, emails });
        results.emails = Array.from(new Set([...results.emails, ...emails]));
        // if you want to stop after first found, uncomment:
        // if (results.emails.length) break;
      } catch (err) {
        // log and continue - don't leak internal errors to client
        results.pages.push({ page: full, error: String(err) });
      }
    }

    return res.json(results);
  } catch (err) {
    console.error("Fatal error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
