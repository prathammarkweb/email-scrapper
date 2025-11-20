import puppeteer from "puppeteer";

export default async function handler(req, res) {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Please provide ?url=" });
    }

    // Use bundled Chromium path
    const browser = await puppeteer.launch({
      headless: true,
      product: "chrome",
      channel: "chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();
    await page.goto(targetUrl.startsWith("http") ? targetUrl : "https://" + targetUrl, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    const html = await page.content();

    const emails =
      html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];

    await browser.close();

    return res.status(200).json({
      url: targetUrl,
      emails: [...new Set(emails)],
      success: true
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
