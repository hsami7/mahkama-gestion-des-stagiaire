const fs = require('fs');
const PizZip = require('pizzip');

// Always start from a clean backup of the original template if possible, or read public/evaluation_template.docx
const zip = new PizZip(fs.readFileSync('public/evaluation_template.docx'));
let xml = zip.file('word/document.xml').asText();

// 1. Fix overall period dates in paragraph 501BA750 (من: ...) and paragraph 4FEE88CB (إلى: ...)
xml = xml.replace(
  /<w:p w14:paraId="501BA750"[^>]*>.*?<\/w:p>/s,
  `<w:p w14:paraId="501BA750"><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr><w:t xml:space="preserve">من: {from}</w:t></w:r></w:p>`
);

xml = xml.replace(
  /<w:p w14:paraId="4FEE88CB"[^>]*>.*?<\/w:p>/s,
  `<w:p w14:paraId="4FEE88CB"><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr><w:t xml:space="preserve">إلى: {to}</w:t></w:r></w:p>`
);

// 2. Replace static rotation rows (ROW 3, ROW 4, ROW 5, ROW 6) with a single dynamic {#rots} row!
// Let's locate the table rows in document.xml
const trs = xml.match(/<w:tr[^>]*>.*?<\/w:tr>/gs);
if (trs && trs.length >= 7) {
  // ROW 3 is trs[3], ROW 4 is trs[4], ROW 5 is trs[5], ROW 6 is trs[6]
  const dynamicRow = `<w:tr w:rsidR="002D44BB" w14:paraId="47CACE77"><w:trPr><w:trHeight w:val="892"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="3369" w:type="dxa"/><w:gridSpan w:val="2"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr><w:t>{#rots}المشرف على التكوين</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rtl/></w:rPr><w:t>{supervisor}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3298" w:type="dxa"/><w:gridSpan w:val="3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr><w:t>الشعبة</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rtl/></w:rPr><w:t>{department}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3294" w:type="dxa"/><w:gridSpan w:val="2"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr><w:t xml:space="preserve">الفترة {num}</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">من: {from} إلى: {to}{/rots}</w:t></w:r></w:p></w:tc></w:tr>`;

  // Replace trs[3], trs[4], trs[5], trs[6] block with dynamicRow
  const blockToReplace = trs[3] + trs[4] + trs[5] + trs[6];
  xml = xml.replace(blockToReplace, dynamicRow);
}

// 3. Fix checkboxes if needed (already converted to {c1_no}, {c1_yes}, etc.)
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

// 4. Notes: Remove all the trailing dots lines and replace with a clean {notes} tag
xml = xml.replace(/<w:t>\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s*<\/w:t>/g, '');
xml = xml.replace(/<w:t>\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s*<\/w:t>/g, '');

// Ensure {notes} is in paragraph 3ADB25F8 (where ملاحظات header is)
xml = xml.replace(
  /<w:p w14:paraId="4396676C"[^>]*>.*?<\/w:p>/s,
  `<w:p w14:paraId="4396676C"><w:pPr><w:jc w:val="right"/><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Samir_Khouaja_Maghribi"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl/></w:rPr><w:t>{notes}</w:t></w:r></w:p>`
);

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync('public/evaluation_template.docx', buffer);
console.log('Template dynamically updated!');
