/**
 * Guards the translations. Two checks, both aimed at the same failure — a raw
 * key like `auth.login.title` rendered on screen:
 *
 *   1. every language defines exactly the same key paths;
 *   2. every literal key the code passes to t('...') exists.
 *
 * Keys built at runtime (t(`customers.status.${status}`)) can't be checked
 * statically; for those, the static part before `${` must at least exist.
 *
 * Run by `npm run check:locales`.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const localesRoot = path.join(projectRoot, 'src', 'i18n', 'locales');
const languages = fs
  .readdirSync(localesRoot)
  .filter((f) => fs.statSync(path.join(localesRoot, f)).isDirectory());

if (languages.length === 0) {
  console.error('No locale folders found in src/i18n/locales.');
  process.exit(1);
}

/** Flatten { a: { b: "x" } } to ["a.b"]. */
function keyPaths(value, prefix = '') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

const keysByLanguage = {};
for (const language of languages) {
  const dir = path.join(localesRoot, language);
  const namespaces = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  keysByLanguage[language] = namespaces.flatMap((file) => {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    return keyPaths(json, path.basename(file, '.json'));
  });
}

const [reference, ...others] = languages;
const referenceKeys = new Set(keysByLanguage[reference]);
const problems = [];

// ── 1. Languages agree ──────────────────────────────────────────────────────
for (const language of others) {
  const keys = new Set(keysByLanguage[language]);
  for (const key of referenceKeys) {
    if (!keys.has(key)) problems.push(`${language} is missing "${key}" (present in ${reference})`);
  }
  for (const key of keys) {
    if (!referenceKeys.has(key)) problems.push(`${language} has extra key "${key}"`);
  }
}

// ── 2. Keys used in code exist ──────────────────────────────────────────────
function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

// Every key, plus every section above it ("auth", "auth.login", ...).
const knownPrefixes = new Set();
for (const key of referenceKeys) {
  const parts = key.split('.');
  for (let i = 1; i <= parts.length; i += 1) knownPrefixes.add(parts.slice(0, i).join('.'));
}

const literalCall = /\bt\(\s*'([a-zA-Z0-9_.]+)'/g;
const templateCall = /\bt\(\s*`([a-zA-Z0-9_.]+)\.\$\{/g;
let checkedCalls = 0;

for (const file of sourceFiles(path.join(projectRoot, 'src'))) {
  const code = fs.readFileSync(file, 'utf8');
  const relative = path.relative(projectRoot, file);

  for (const match of code.matchAll(literalCall)) {
    checkedCalls += 1;
    if (!referenceKeys.has(match[1])) problems.push(`${relative}: t('${match[1]}') is not defined`);
  }
  for (const match of code.matchAll(templateCall)) {
    checkedCalls += 1;
    if (!knownPrefixes.has(match[1])) {
      problems.push(`${relative}: t(\`${match[1]}.\${...}\`) - "${match[1]}" is not defined`);
    }
  }
}

if (problems.length) {
  console.error('Locale check failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Locales OK — ${languages.join(', ')} all define the same ${referenceKeys.size} keys; ` +
    `${checkedCalls} t() calls in src/ resolve.`,
);
