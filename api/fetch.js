import puppeteer from "puppeteer";

export default async function handler(req, res) {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Please provide ?url=" });
    }

    const browser = await puppeteer.launch({
      headless: "new"
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();

    const emails = [...new Set(html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g))];

    await browser.close();

    res.json({
      url: targetUrl,
      emails: emails || [],
      success: true
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
