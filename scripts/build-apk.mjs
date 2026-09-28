/**
 * Build a release APK LOCALLY with Gradle — no EAS queue.
 *
 *     npm run apk
 *
 * Why this exists: waiting in the EAS build queue is slow, and a plain local
 * build is worse than useless here because a debug-signed APK gets a different
 * Android device id (SSAID is scoped to the signing key) and core banking then
 * refuses it. So this signs with the COMPANY keystore from credentials.json,
 * exactly as EAS does, and the APK behaves like an EAS build on the registered
 * phone.
 *
 * It is self-contained and idempotent:
 *   - runs `expo prebuild` if android/ is missing;
 *   - copies the keystore into android/app/ and writes its passwords to
 *     android/gradle.properties (git-ignored, so no secret is committed);
 *   - points Gradle at Android Studio's bundled JDK (the machine default is
 *     Java 8, too old for SDK 57);
 *   - re-applies the release signingConfig if a prebuild reset build.gradle;
 *   - runs `gradlew assembleRelease` and prints the APK path.
 *
 * Requirements: the Android SDK, and a JDK 17+ — Android Studio's bundled JBR
 * is found automatically. Windows/macOS/Linux.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ANDROID = path.join(ROOT, 'android');
const APP = path.join(ANDROID, 'app');
const isWin = process.platform === 'win32';

const die = (message) => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: isWin, ...opts });

/** Android Studio's bundled JDK (or JAVA_HOME if it is already 17+). */
function findJdk() {
  const candidates = [
    process.env.JAVA_HOME_17,
    isWin ? 'C:/Program Files/Android/Android Studio/jbr' : null,
    isWin ? 'C:/Program Files/Android/Android Studio1/jbr' : null,
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    path.join(os.homedir(), 'Android/Studio/jbr'),
  ].filter(Boolean);
  for (const dir of candidates) {
    const java = path.join(dir, 'bin', isWin ? 'java.exe' : 'java');
    if (fs.existsSync(java)) return dir;
  }
  // Fall back to JAVA_HOME only if it is 17+.
  if (process.env.JAVA_HOME) {
    try {
      const out = execFileSync(path.join(process.env.JAVA_HOME, 'bin', isWin ? 'java.exe' : 'java'), [
        '-version',
      ], { stdio: ['ignore', 'ignore', 'pipe'] }).toString();
      const major = Number(/version "(\d+)/.exec(out)?.[1]);
      if (major >= 17) return process.env.JAVA_HOME;
    } catch {
      /* ignore */
    }
  }
  return null;
}

// ── 1. keystore + passwords ───────────────────────────────────────────────
const credentialsFile = path.join(ROOT, 'credentials.json');
if (!fs.existsSync(credentialsFile)) {
  die(
    'credentials.json is missing. Get it with:\n' +
      '  npx eas-cli credentials -p android  (production → credentials.json → Download)',
  );
}
const keystore = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'))?.android?.keystore;
if (!keystore?.keystorePath) die('credentials.json has no android.keystore.');

const srcKeystore = path.join(ROOT, keystore.keystorePath);
if (!fs.existsSync(srcKeystore)) die(`Keystore not found at ${keystore.keystorePath}.`);

// ── 2. prebuild if needed ─────────────────────────────────────────────────
if (!fs.existsSync(ANDROID)) {
  console.log('android/ not found — running expo prebuild…');
  if (run('npx', ['expo', 'prebuild', '-p', 'android', '--no-install']).status !== 0)
    die('expo prebuild failed.');
}

// ── 3. copy keystore + write gradle.properties ────────────────────────────
fs.copyFileSync(srcKeystore, path.join(APP, 'cba-release.keystore'));

const jdk = findJdk();
if (!jdk) die('No JDK 17+ found. Install one, or set JAVA_HOME_17 to its path.');

const propsFile = path.join(ANDROID, 'gradle.properties');
let props = fs.readFileSync(propsFile, 'utf8');
const managed = [
  ['CBA_STORE_FILE', 'cba-release.keystore'],
  ['CBA_STORE_PASSWORD', keystore.keystorePassword ?? ''],
  ['CBA_KEY_ALIAS', keystore.keyAlias ?? ''],
  ['CBA_KEY_PASSWORD', keystore.keyPassword ?? ''],
  ['org.gradle.java.home', jdk.replace(/\\/g, '/')],
];
for (const [key, value] of managed) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key.replace(/\./g, '\\.')}=.*$`, 'm');
  props = re.test(props) ? props.replace(re, line) : `${props.trimEnd()}\n${line}\n`;
}
fs.writeFileSync(propsFile, props);

// ── 4. re-apply the release signingConfig if a prebuild reset build.gradle ─
const gradleFile = path.join(APP, 'build.gradle');
let gradle = fs.readFileSync(gradleFile, 'utf8');
if (!gradle.includes('CBA_STORE_FILE')) {
  gradle = gradle.replace(
    /signingConfigs \{\n\s*debug \{[\s\S]*?\n {8}\}\n/,
    (m) =>
      `${m}        release {\n` +
      `            if (project.hasProperty('CBA_STORE_FILE')) {\n` +
      `                storeFile file(project.property('CBA_STORE_FILE'))\n` +
      `                storePassword project.property('CBA_STORE_PASSWORD')\n` +
      `                keyAlias project.property('CBA_KEY_ALIAS')\n` +
      `                keyPassword project.property('CBA_KEY_PASSWORD')\n` +
      `            }\n        }\n`,
  );
  gradle = gradle.replace(
    /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
    `$1signingConfig project.hasProperty('CBA_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
  );
  fs.writeFileSync(gradleFile, gradle);
}

// ── 5. build ──────────────────────────────────────────────────────────────
console.log(`\nBuilding release APK with JDK at:\n  ${jdk}\n`);
// Absolute path: a bare "gradlew.bat" is not found on Windows (it is not on
// PATH, and shell mode does not look in cwd), and "./gradlew" needs the dot.
const gradlew = path.join(ANDROID, isWin ? 'gradlew.bat' : 'gradlew');
const build = run(gradlew, ['assembleRelease'], { cwd: ANDROID });
if (build.status !== 0) die('Gradle build failed (output above).');

const apk = path.join(APP, 'build', 'outputs', 'apk', 'release', 'app-release.apk');
console.log(
  fs.existsSync(apk)
    ? `\n✔ APK ready:\n  ${apk}\n`
    : '\n✔ Build finished, but the APK was not at the expected path — check android/app/build/outputs/apk/release/.',
);
