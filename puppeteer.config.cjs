const { chromium } = require("playwright");

const browser = await chromium.launch({
  headless: true,
});
