const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const filePath = `file://${path.resolve(__dirname, 'cv.html')}`;
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'cv.pdf',
    format: 'A4',
    margin: { top: '1.8cm', bottom: '1.8cm', left: '2cm', right: '2cm' },
    printBackground: false
  });

  await browser.close();
  console.log('cv.pdf generated');
})();
