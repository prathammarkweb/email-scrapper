const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/api/fetch", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.json({ error: "URL is required" });

    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome-stable", // <-- RENDER CHROME PATH
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const pageContent = await page.content();
    const email = pageContent.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    await browser.close();

    return res.json({
      url,
      email: email ? email[0] : "No email found"
    });

  } catch (err) {
    return res.json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
