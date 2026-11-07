/** Writes docs/prototype/dialogue-matrix.md from the case data (run from app/: npx tsx ../tools/proto-matrix.ts). */
import { writeFileSync } from 'fs';
import { CHALLENGES, EVIDENCE_BLOCKS, QUESTIONS, TOPIC_LABEL } from '../app/src/prototype/caseData';
import { KIND_LABEL, explainLine } from '../app/src/prototype/strings';
import { FACTS, relateToFacts } from '../app/src/prototype/caseData';

const out: string[] = [];
const P = (x = '') => out.push(x);
const det = (as: { slot: string; value: string }[]) => (as.length ? as.map((a) => `${a.slot}=${a.value}`).join(', ') : '—');
P('# Haunted House — dialogue matrix (EN / ES)');
P();
P('Generated from `app/src/prototype/caseData.ts` by `tools/proto-matrix.ts`. Do not edit by hand.');
P('Kinds (compatible / contradiction / unsupported extra detail / vague) are manually reviewed authoring metadata, shown to players only at the reveal. Contradictions are justified one by one in [contradiction-audit.md](contradiction-audit.md).');
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
    P(`### ${c.id} · ${KIND_LABEL[c.kind].en}`);
    P(`- EN: “${c.text.en}”`);
    P(`- ES: “${c.text.es}”`);
    P(`- States: ${det(c.asserts)}`);
    P(`- Reveal EN: ${xe.lines.join(' ')}`);
    P(`- Reveal ES: ${xs.lines.join(' ')}`);
    P(`- Follow-up: “${c.followUp.q.en}” / “${c.followUp.q.es}”`);
    P();
    P('| id | kind | EN | ES | states | reveal (EN) |');
    P('|---|---|---|---|---|---|');
    for (const r of c.followUp.responses) {
      const re = explainLine(r.id, 'response', 'en');
      P(`| ${r.id} | ${KIND_LABEL[r.kind].en}${r.revises ? ' · correction' : ''} | ${r.text.en} | ${r.text.es} | ${det(r.asserts)} | ${re.lines.join(' ')} |`);
    }
    P();
  }
}
P('## Final bluff questions');
for (const ch of CHALLENGES) P(`- **${ch.slot}**: “${ch.q.en}” / “${ch.q.es}” — ${ch.options.map((o) => `${o.text.en} / ${o.text.es}`).join(' · ')}`);
writeFileSync(__dirname + '/../docs/prototype/dialogue-matrix.md', out.join('\n') + '\n');

// ---- contradiction audit: every line reviewed as a contradiction, with its justification
const A: string[] = [];
const Q = (x = '') => A.push(x);
Q('# Contradiction audit — Haunted House (EN)');
Q();
Q('Generated from the reviewed data by `tools/proto-matrix.ts`; the reasoning text itself was written and reviewed by hand.');
Q('A line is a contradiction only if it cannot reasonably be true about the same visit as the evidence. Everything else is compatible, an unsupported extra detail, vague, or a correction.');
Q();
Q('Evidence: ' + EVIDENCE_BLOCKS.map((b) => `**${b.block}.** ${b.text.en}`).join(' '));
Q();
Q('| line | claim (in context) | evidence it contradicts | why both cannot be true | reconciliation considered |');
Q('|---|---|---|---|---|');
let n = 0;
for (const q of QUESTIONS)
  for (const c of q.claims)
    for (const line of [c, ...c.followUp.responses]) {
      if (line.kind !== 'contradiction') continue;
      n++;
      const ctx = line === c ? `Q: “${q.text.en}” → “${c.text.en}”` : `“${c.text.en}” → Q: “${c.followUp.q.en}” → “${line.text.en}”`;
      const facts = relateToFacts(line.asserts).conflicts.map((f) => FACTS.find((x) => x.id === f)!.text.en).join(' / ');
      Q(`| ${line.id} | ${ctx} | ${facts} | ${line.why!.en} | ${line.reconcile!.en} |`);
    }
Q();
Q(`${n} contradictions in total.`);
writeFileSync(__dirname + '/../docs/prototype/contradiction-audit.md', A.join('\n') + '\n');
console.log('wrote', out.length, 'lines');
