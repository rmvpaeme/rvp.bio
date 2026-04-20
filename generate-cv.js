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
