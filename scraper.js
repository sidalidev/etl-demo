const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrape() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Exemple: scraping de HackerNews
  await page.goto('https://news.ycombinator.com');

  const articles = await page.evaluate(() => {
    const items = document.querySelectorAll('.athing');
    return Array.from(items).map(item => ({
      id: item.getAttribute('id'),
      title: item.querySelector('.titleline a').innerText,
      url: item.querySelector('.titleline a').href
    }));
  });

  await fs.writeFile('raw_data.json', JSON.stringify(articles, null, 2));
  await browser.close();
}

scrape().catch(console.error);