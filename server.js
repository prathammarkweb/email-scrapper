import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Email Scraper Running ✔");
});

app.get("/api/fetch", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing ?url= parameter" });
    }

    console.log("Launching browser for:", url);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process"
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    const html = await page.content();
    await browser.close();

    // Extract simple emails
    const emails = [...new Set(
      (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g) || [])
    )];

    res.json({ url, emails });

  } catch (error) {
    console.error("Error in /api/fetch:", error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
