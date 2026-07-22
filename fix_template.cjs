const fs = require('fs');
const PizZip = require('pizzip');

const zip = new PizZip(fs.readFileSync('public/evaluation_template.docx'));
let xml = zip.file('word/document.xml').asText();

// 1. Fix overall period "من: 03/11/2025 إلى: 30/04/2026" -> "من: {from} إلى: {to}"
xml = xml.replace(
  /<w:t>03<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>\/<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>11<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>\/<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>2025<\/w:t>/g,
  '<w:t>{from}</w:t>'
);
xml = xml.replace(
  /<w:t>30<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>\/<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>04<\/w:t><\/w:r><w:r><w:rPr>[^<]*<\/w:rPr><w:t>\/2026<\/w:t>/g,
  '<w:t>{to}</w:t>'
);

// 2. Fix Period 1 dates "من: 03/11/2025 إلى: 28/11/2025" -> "من: {f1} إلى: {t1}"
xml = xml.replace(
  /<w:t>03<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>11<\/w:t><\/w:r><w:r><w:t>\/2025 إلى: <\/w:t><\/w:r><w:r><w:t>28<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>11<\/w:t><\/w:r><w:r><w:t>\/2025<\/w:t>/g,
  '<w:t>{f1} إلى: {t1}</w:t>'
);

// 3. Fix Period 2 dates "من: 01/12/2025 إلى: 31/12/2025" -> "من: {f2} إلى: {t2}"
xml = xml.replace(
  /<w:t>01<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>12<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>2025<\/w:t><\/w:r><w:r><w:t> إلى: <\/w:t><\/w:r><w:r><w:t>31<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>12<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>2025<\/w:t>/g,
  '<w:t>{f2} إلى: {t2}</w:t>'
);

// 4. Fix Period 3 dates "من: 02/01/2026 إلى: 10/04/2026"
xml = xml.replace(
  /<w:t>02<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>01<\/w:t><\/w:r><w:r><w:t>\/2026 إلى: <\/w:t><\/w:r><w:r><w:t>10<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>04<\/w:t><\/w:r><w:r><w:t>\/2026<\/w:t>/g,
  '<w:t>{f3} إلى: {t3}</w:t>'
);

// 5. Fix Period 4 dates "من: 13/04/2026 إلى: 30/04/2026"
xml = xml.replace(
  /<w:t>13<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>04<\/w:t><\/w:r><w:r><w:t>\/2026 إلى: <\/w:t><\/w:r><w:r><w:t>30<\/w:t><\/w:r><w:r><w:t>\/<\/w:t><\/w:r><w:r><w:t>04<\/w:t><\/w:r><w:r><w:t>\/2026<\/w:t>/g,
  '<w:t>{f4} إلى: {t4}</w:t>'
);

// 6. Hardcoded supervisors in P3 and P4:
xml = xml.replace(/إناس بنبراهيم/g, '{sup3}');
xml = xml.replace(/نوفل العيساوي/g, '{sup4}');
xml = xml.replace(/الخبرة والمسح الضوئي/g, '{dep4}');

// 7. Checkboxes: replace w14:checkbox controls with {cX_yes} and {cX_no}
// We have 4 rows of criteria, each row has 2 checkboxes (yes / no or no / yes).
// Let's replace each <w14:checkbox>...</w14:checkbox> block or <w:sdt>...</w:sdt> block sequentially.
let cbIndex = 0;
const cbTags = [
  '{c1_no}', '{c1_yes}',
  '{c2_no}', '{c2_yes}',
  '{c3_no}', '{c3_yes}',
  '{c4_no}', '{c4_yes}'
];

xml = xml.replace(/<w:sdt>(?:(?!<\/w:sdt>).)*?<w14:checkbox>(?:(?!<\/w:sdt>).)*?<\/w:sdt>/gs, (match) => {
  const tag = cbTags[cbIndex++] || '';
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${tag}</w:t></w:r></w:p>`;
});

// 8. Notes dots replacement:
xml = xml.replace(/<w:t>\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s*<\/w:t>/g, '<w:t>{notes}</w:t>');

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync('public/evaluation_template.docx', buffer);
console.log('Template fixed successfully!');
