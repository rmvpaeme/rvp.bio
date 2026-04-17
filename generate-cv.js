const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pdfOptions = {
    format: 'A4',
    margin: { top: '1.8cm', bottom: '1.8cm', left: '2cm', right: '2cm' },
    printBackground: false
  };

  const files = [
    { html: 'cv.html',      pdf: 'cv.pdf' },
    { html: 'cv-lite.html', pdf: 'cv-lite.pdf' },
  ];

  for (const { html, pdf } of files) {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(__dirname, html)}`, { waitUntil: 'networkidle0' });
    await page.pdf({ ...pdfOptions, path: pdf });
    await page.close();
    console.log(`${pdf} generated`);
  }

  await browser.close();
})();
