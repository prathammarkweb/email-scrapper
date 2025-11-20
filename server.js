const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/api/fetch", async (req, res) => {
  try {
    const targetURL = req.query.url;
    if (!targetURL) {
      return res.json({ error: "Missing ?url=" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();
    await page.goto(targetURL, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();

    const emailMatch = html.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    await browser.close();

    return res.json({
      email: emailMatch ? emailMatch[0] : null,
      url: targetURL
    });

  } catch (error) {
    return res.json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
