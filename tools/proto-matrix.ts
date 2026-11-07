/** Writes docs/prototype/dialogue-matrix.md from the case data (run from app/: npx tsx ../tools/proto-matrix.ts). */
import { writeFileSync } from 'fs';
import { CHALLENGES, EVIDENCE_BLOCKS, QUESTIONS, TOPIC_LABEL } from '../app/src/prototype/caseData';
import { CLS_LABEL, explainLine } from '../app/src/prototype/strings';

const out: string[] = [];
const P = (x = '') => out.push(x);
const det = (as: { slot: string; value: string }[]) => (as.length ? as.map((a) => `${a.slot}=${a.value}`).join(', ') : '—');
P('# Haunted House — dialogue matrix (EN / ES)');
P();
P('Generated from `app/src/prototype/caseData.ts` by `tools/proto-matrix.ts`. Do not edit by hand.');
P('Classification and explanations are authoring metadata, shown to players only at the reveal.');
P();
P('## Evidence');
for (const b of EVIDENCE_BLOCKS) P(`- **${b.block}. ${b.title.en} / ${b.title.es}** — ${b.text.en} / ${b.text.es}`);
P();
for (const q of QUESTIONS) {
  P(`## ${q.id} · ${TOPIC_LABEL[q.topic].en} — “${q.text.en}” / “${q.text.es}”`);
  P();
  for (const c of q.claims) {
    const xe = explainLine(c.id, 'claim', 'en');
    const xs = explainLine(c.id, 'claim', 'es');
    P(`### ${c.id} · ${CLS_LABEL[c.cls].en}`);
    P(`- EN: “${c.text.en}”`);
    P(`- ES: “${c.text.es}”`);
    P(`- States: ${det(c.asserts)}`);
    P(`- Reveal EN: ${xe.lines.join(' ')}`);
    P(`- Reveal ES: ${xs.lines.join(' ')}`);
    P(`- Follow-up: “${c.followUp.q.en}” / “${c.followUp.q.es}”`);
    P();
    P('| id | class | EN | ES | states | reveal (EN) |');
    P('|---|---|---|---|---|---|');
    for (const r of c.followUp.responses) {
      const re = explainLine(r.id, 'response', 'en');
      P(`| ${r.id} | ${CLS_LABEL[r.cls].en}${r.revises ? ' (correction)' : ''} | ${r.text.en} | ${r.text.es} | ${det(r.asserts)} | ${re.lines.join(' ')} |`);
    }
    P();
  }
}
P('## Final bluff questions');
for (const ch of CHALLENGES) P(`- **${ch.slot}**: “${ch.q.en}” / “${ch.q.es}” — ${ch.options.map((o) => `${o.text.en} / ${o.text.es}`).join(' · ')}`);
writeFileSync(__dirname + '/../docs/prototype/dialogue-matrix.md', out.join('\n') + '\n');
console.log('wrote', out.length, 'lines');
