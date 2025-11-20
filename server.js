import express from "express";
import { chromium } from "@playwright/test";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Email Scraper Running ✔");
});

app.get("/api/fetch", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url= parameter" });

    console.log("Scraping:", url);

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    const html = await page.content();
    await browser.close();

    const emails = [
      ...new Set(
        (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g) || [])
      ),
    ];

    res.json({ url, emails });
  } catch (err) {
    console.error("Scraper error:", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
