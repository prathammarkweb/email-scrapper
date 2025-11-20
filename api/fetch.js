// api/fetch.js
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  try {
    // Simple API key protection (optional). Set VERCEL_API_KEY in Vercel env if you want.
    const expectedKey = process.env.VERCEL_API_KEY || '';
    if (expectedKey) {
      const got = req.headers['x-api-key'] || req.query.key || '';
      if (!got || got !== expectedKey) {
        res.status(401).json({ error: 'missing or invalid api key' });
        return;
      }
    }

    const rawUrl = req.query.url || req.body && req.body.url;
    if (!rawUrl) {
      res.status(400).json({ error: "Missing 'url' query parameter" });
      return;
    }

    // normalize
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    // Launch chromium (works on Vercel)
    const executablePath = await chromium.executablePath;
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
      defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();

    // Set realistic headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    // Set navigation timeout
    await page.setDefaultNavigationTimeout(30000);

    // Go to the page and wait until network idle (handles JS)
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Optional: wait small time to allow async content to render
    await page.waitForTimeout(1000);

    // Get page content
    const html = await page.content();

    // Optionally extract emails here (simple regex)
    const emails = Array.from(new Set(
      (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
    ));

    await browser.close();

    // Return JSON with both HTML (truncated) and emails
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      url,
      emails,
      html_snippet: html.slice(0, 4000) // avoid huge payloads; full HTML would be heavy
    });

  } catch (err) {
    // attempt to close browser if open
    try { if (global.browser) await global.browser.close(); } catch(e){}
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
