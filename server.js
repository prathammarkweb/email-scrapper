import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

// Root
app.get("/", (req, res) => {
  res.send("Email Scraper Running ✔");
});

// API route
app.get("/api/fetch", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("Fetching:", url);

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer"
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const content = await page.evaluate(() => document.body.innerText);

    await browser.close();

    res.json({
      success: true,
      url,
      content
    });

  } catch (err) {
    console.error("Scraper Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Render-specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
