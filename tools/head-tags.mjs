// Adds site-verification tags to the built web page (Google Search Console / Google Play).
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'app/dist/index.html';
const tags = ['<meta name="google-site-verification" content="k-2MBXqEnfaPXfB5XUjDjlpBfkP4Sz6W9Y7WYJVeGI8" />'];
let html = readFileSync(file, 'utf8');
for (const t of tags) if (!html.includes(t)) html = html.replace('<head>', '<head>' + t);
writeFileSync(file, html);
