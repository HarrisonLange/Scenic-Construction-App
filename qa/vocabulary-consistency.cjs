const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const LAB_DISCIPLINES = {
  costume: ['costume'],
  designlab: ['design', 'scenic'],
  draftinglab: ['design', 'scenic'],
  lighting: ['lighting'],
  'lighting-people': ['lighting'],
  linemixing: ['sound'],
  pattern: ['costume'],
  scenic: ['scenic'],
  sound: ['sound'],
  soundcues: ['sound'],
  studiolab: ['lighting'],
};

function balanced(source, start, open = '[', close = ']') {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === open) depth += 1;
    else if (char === close && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed ${open} at character ${start}`);
}

function evaluateLiteral(literal, file) {
  return vm.runInNewContext(`(${literal})`, Object.create(null), { filename: file, timeout: 1_000 });
}

function canonicalVocabulary() {
  const file = path.join(root, 'vocab', 'index.html');
  const source = fs.readFileSync(file, 'utf8');
  const marker = 'const VOCAB =';
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) throw new Error('Could not find the canonical VOCAB array.');
  const arrayAt = source.indexOf('[', markerAt + marker.length);
  return evaluateLiteral(balanced(source, arrayAt), file);
}

function labGlossaries() {
  const results = [];
  const files = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'index.html')) && entry.name !== 'vocab')
    .map((entry) => path.join(root, entry.name, 'index.html'));
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    let searchAt = 0;
    while ((searchAt = source.indexOf('attachGlossary({', searchAt)) >= 0) {
      const termsAt = source.indexOf('terms:', searchAt);
      if (termsAt < 0) break;
      const arrayAt = source.indexOf('[', termsAt + 6);
      const terms = evaluateLiteral(balanced(source, arrayAt), file);
      results.push({ lab: path.basename(path.dirname(file)), terms });
      searchAt = arrayAt + 1;
    }
  }
  return results;
}

function normalize(value) {
  return String(value).normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase().replace(/\s+/g, ' ');
}

const vocabulary = canonicalVocabulary();
const glossaries = labGlossaries();
const canonical = new Map();
const canonicalByTerm = new Map();
const duplicateCanonicalTerms = [];
for (const item of vocabulary) {
  const termKey = normalize(item.term);
  const key = `${item.discipline}:${termKey}`;
  if (canonical.has(key)) duplicateCanonicalTerms.push(item.term);
  else canonical.set(key, item);
  if (!canonicalByTerm.has(termKey)) canonicalByTerm.set(termKey, []);
  canonicalByTerm.get(termKey).push(item);
}

const exact = [];
const mismatches = [];
const missing = [];
const crossDisciplineHomonyms = [];
for (const glossary of glossaries) {
  for (const [term, definition] of glossary.terms) {
    const termKey = normalize(term);
    const allowedDisciplines = LAB_DISCIPLINES[glossary.lab] || [];
    const authority = allowedDisciplines.map((discipline) => canonical.get(`${discipline}:${termKey}`)).find(Boolean);
    if (!authority) {
      const otherDisciplines = canonicalByTerm.get(termKey) || [];
      if (otherDisciplines.length) {
        crossDisciplineHomonyms.push({
          lab: glossary.lab,
          term,
          labDisciplines: allowedDisciplines,
          canonicalDisciplines: otherDisciplines.map((item) => item.discipline),
          definition,
        });
      } else missing.push({ lab: glossary.lab, term, definition });
    } else if (definition === authority.def) {
      exact.push({ lab: glossary.lab, term });
    } else {
      mismatches.push({ lab: glossary.lab, term, canonicalDiscipline: authority.discipline, labDefinition: definition, canonicalDefinition: authority.def });
    }
  }
}

const report = {
  canonicalTerms: vocabulary.length,
  labGlossaries: glossaries.length,
  labGlossaryTerms: exact.length + mismatches.length + missing.length + crossDisciplineHomonyms.length,
  exactMatches: exact.length,
  byLab: glossaries.map((glossary) => ({
    lab: glossary.lab,
    terms: glossary.terms.length,
    exact: exact.filter((item) => item.lab === glossary.lab).length,
    mismatched: mismatches.filter((item) => item.lab === glossary.lab).length,
    missingFromCanonical: missing.filter((item) => item.lab === glossary.lab).length,
    crossDisciplineHomonyms: crossDisciplineHomonyms.filter((item) => item.lab === glossary.lab).length,
  })),
  mismatches,
  termsMissingFromCanonicalVocabulary: missing,
  crossDisciplineHomonyms,
  duplicateCanonicalTerms,
};
if (process.argv.includes('--summary')) {
  console.log(JSON.stringify({
    canonicalTerms: report.canonicalTerms,
    labGlossaries: report.labGlossaries,
    labGlossaryTerms: report.labGlossaryTerms,
    exactMatches: report.exactMatches,
    mismatches: report.mismatches.length,
    labOnlyTermsReviewedSeparately: report.termsMissingFromCanonicalVocabulary.length,
    crossDisciplineHomonyms: report.crossDisciplineHomonyms.length,
    duplicateCanonicalTerms: report.duplicateCanonicalTerms.length,
    byLab: report.byLab,
  }, null, 2));
} else console.log(JSON.stringify(report, null, 2));
process.exitCode = mismatches.length || duplicateCanonicalTerms.length ? 1 : 0;
