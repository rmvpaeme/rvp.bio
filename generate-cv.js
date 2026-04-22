const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const metadata = {
  author:   'Ruben Van Paemel',
  creator:  'rvp.bio',
  producer: 'rvp.bio',
  keywords: ['pediatric oncology', 'hematology', 'liquid biopsy', 'cfDNA', 'bioinformatics', 'MD', 'PhD', 'GCP'],
};

const files = [
  { html: 'cv.html',      pdf: 'cv.pdf',      title: 'CV — Ruben Van Paemel, MD/PhD',        subject: 'Curriculum Vitae' },
  { html: 'cv-lite.html', pdf: 'cv-lite.pdf',  title: 'CV (lite) — Ruben Van Paemel, MD/PhD', subject: 'Curriculum Vitae (Selected Publications)' },
];

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pdfOptions = {
    format: 'A4',
    margin: { top: '1.8cm', bottom: '1.8cm', left: '2cm', right: '2cm' },
    printBackground: false
  };

  for (const { html, pdf, title, subject } of files) {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(__dirname, html)}`, { waitUntil: 'networkidle0' });

    // Merge year + title into one text node so PDF has a single text run per item
    // (prevents copy-paste garbling caused by separate DOM elements being stored as
    //  separate PDF text chunks with newlines inserted between them)
    await page.evaluate(() => {
      // cv-list items: "2025 — Title\nSubtitle"
      document.querySelectorAll('.cv-list li').forEach(li => {
        const year = li.querySelector('.li-year')?.textContent?.trim() || '';
        const body = li.querySelector('.li-body')?.textContent?.trim() || '';
        const sub  = li.querySelector('.li-sub')?.textContent?.trim()  || '';
        li.innerHTML = `<span>${year} \u2014 ${body}</span>`
          + (sub ? `<div class="li-sub">${sub}</div>` : '');
      });

      // cv-entry items: "Date | Title" as one heading, then org + bullets below
      document.querySelectorAll('.cv-entry').forEach(entry => {
        const dateEl = entry.querySelector('.cv-date');
        const h3     = entry.querySelector('.cv-body h3');
        if (dateEl && h3) {
          h3.textContent = `${dateEl.textContent.trim()} \u2014 ${h3.textContent.trim()}`;
          dateEl.remove();
        }
      });

      // pub-item: merge number into title text node
      document.querySelectorAll('.pub-item').forEach(item => {
        const num   = item.querySelector('.pub-num');
        const title = item.querySelector('.pub-item-title');
        if (num && title) {
          title.textContent = `${num.textContent.trim()}. ${title.textContent.trim()}`;
          num.remove();
        }
      });
    });

    await page.emulateMediaType('print');
    await page.pdf({ ...pdfOptions, path: pdf });
    await page.close();

    // Inject PDF metadata via pdf-lib
    const pdfDoc = await PDFDocument.load(fs.readFileSync(pdf));
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(metadata.author);
    pdfDoc.setSubject(subject);
    pdfDoc.setKeywords(metadata.keywords);
    pdfDoc.setCreator(metadata.creator);
    pdfDoc.setProducer(metadata.producer);
    fs.writeFileSync(pdf, await pdfDoc.save());

    console.log(`${pdf} generated with metadata`);
  }

  await browser.close();
})();
