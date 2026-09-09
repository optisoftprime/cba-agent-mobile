/**
 * Guards the translations: every language must define exactly the same key
 * paths, so a missing string can never fall through to a raw key in the UI.
 * Run by `npm run check:locales`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const languages = fs.readdirSync(root).filter((f) => fs.statSync(path.join(root, f)).isDirectory());

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
  const dir = path.join(root, language);
  const namespaces = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  keysByLanguage[language] = namespaces.flatMap((file) => {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    return keyPaths(json, path.basename(file, '.json'));
  });
}

const [reference, ...others] = languages;
const referenceKeys = new Set(keysByLanguage[reference]);
const problems = [];

for (const language of others) {
  const keys = new Set(keysByLanguage[language]);
  for (const key of referenceKeys) {
    if (!keys.has(key)) problems.push(`${language} is missing "${key}" (present in ${reference})`);
  }
  for (const key of keys) {
    if (!referenceKeys.has(key)) problems.push(`${language} has extra key "${key}"`);
  }
}

if (problems.length) {
  console.error('Locale check failed:\n' + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Locales OK — ${languages.join(', ')} all define the same ${referenceKeys.size} keys.`,
);
