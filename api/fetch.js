import { chromium } from "@playwright/test";

export default async function handler(req, res) {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing ?url=" });
    }

    const browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(
      targetUrl.startsWith("http") ? targetUrl : "https://" + targetUrl,
      { waitUntil: "networkidle" }
    );

    const html = await page.content();

    const emails = [...new Set(html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])];

    await browser.close();

    res.json({
      url: targetUrl,
      emails,
      success: true
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
