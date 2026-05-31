const fs = require('fs');
const path = require('path');
const categories = require('../../backend/src/scripts/categoryData');

const outDir = path.join(__dirname, '../public/images/categories');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function escapeXml(s) {
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function makeSvg(title, subtitle) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">\n  <defs>\n    <linearGradient id="g" x1="0" x2="1">\n      <stop offset="0%" stop-color="#eef2ff"/>\n      <stop offset="100%" stop-color="#e0f2fe"/>\n    </linearGradient>\n  </defs>\n  <rect width="1200" height="675" fill="url(#g)"/>\n  <rect x="60" y="60" width="1080" height="555" rx="20" fill="#ffffff" opacity="0.04"/>\n  <circle cx="160" cy="160" r="86" fill="#0f172a"/>\n  <text x="300" y="150" font-family="Arial,Helvetica,sans-serif" font-size="44" fill="#0f172a">${escapeXml(title)}</text>\n  <text x="300" y="195" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="#0f172a">${escapeXml(subtitle || '')}</text>\n</svg>\n`;
}

let created = 0;
for (const cat of categories) {
  const parentPath = path.join(outDir, `${cat.slug}.svg`);
  if (!fs.existsSync(parentPath)) {
    fs.writeFileSync(parentPath, makeSvg(cat.title, cat.description || ''));
    created++;
  }
  for (const sub of cat.subcategories || []) {
    const subPath = path.join(outDir, `${sub.slug}.svg`);
    if (!fs.existsSync(subPath)) {
      fs.writeFileSync(subPath, makeSvg(sub.title, sub.description || ''));
      created++;
    }
  }
}

console.log(`Generated ${created} SVG files in ${outDir}`);

// Also write a report mapping
const reportLines = [];
reportLines.push('# Category → Image mapping');
for (const cat of categories) {
  reportLines.push(`- **${cat.title}**: /images/categories/${cat.slug}.svg`);
  for (const sub of cat.subcategories || []) {
    reportLines.push(`  - ${sub.title}: /images/categories/${sub.slug}.svg`);
  }
}
fs.writeFileSync(path.join(__dirname, '../public/images/CATEGORY_IMAGE_REPORT.md'), reportLines.join('\n'));
