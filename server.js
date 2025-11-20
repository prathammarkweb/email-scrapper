const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

// DEFAULT ROUTE (so / shows a valid message)
app.get("/", (req, res) => {
  res.send("Email Scraper is Running ✔");
});

// MAIN API ROUTE
app.get("/api/fetch", async (req, res) => {
  try {
    const targetURL = req.query.url;
    if (!targetURL) {
      return res.status(400).json({ error: "Missing ?url=" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.goto(targetURL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const html = await page.content();

    const emails = html.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g
    );

    await browser.close();

    res.json({
      url: targetURL,
      emails: emails || [],
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
