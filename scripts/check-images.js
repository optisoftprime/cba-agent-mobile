/**
 * Fails the build when a branded image would draw a white (or black) BOX on a
 * screen it is shown against.
 *
 * This bug has shipped three times: the logo on the deposit receipt, the
 * in-app loading screen, and the Android launch splash — each an image with a
 * background baked into it, invisible in light mode and glaring in dark mode.
 * `npm run check` now refuses it rather than waiting for QA.
 *
 * The rules, per image:
 *   receiptLogo / receiptLogoDark / adaptiveIconForeground
 *       must be TRANSPARENT — they are drawn over a themed surface.
 *   appIcon
 *       must be OPAQUE — iOS rejects an icon with an alpha channel.
 *
 * Reads the PNG header and the pixels directly; no image library, because this
 * runs in the same `npm run check` as the theme and locale checks.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const IMAGES = path.join(__dirname, '..', 'assets', 'images');

const MUST_BE_TRANSPARENT = [
  'receiptLogo.png',
  'receiptLogoDark.png',
  'adaptiveIconForeground.png',
  'adaptiveIconMonochrome.png',
];
const MUST_BE_OPAQUE = ['appIcon.png'];

/** Minimal PNG reader: enough to get at the pixels' alpha channel. */
function readPng(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);

  let offset = 8;
  let header = null;
  const data = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === 'IDAT') {
      data.push(body);
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length;
  }

  return { header, data: zlib.inflateSync(Buffer.concat(data)) };
}

/**
 * True when any pixel is not fully opaque.
 *
 * PNG rows are filtered (each byte stored as a difference from its neighbour),
 * so the alpha bytes have to be reconstructed before they mean anything —
 * skipping filtered rows would quietly answer "opaque" for almost every real
 * PNG, which is worse than not checking at all.
 */
function hasTransparency(file) {
  const { header, data } = readPng(file);

  // colorType 6 = RGBA, 4 = grey+alpha. Anything else carries no alpha at all.
  if (header.colorType !== 6 && header.colorType !== 4) return false;
  if (header.depth !== 8 || header.interlace !== 0) {
    throw new Error(`${path.basename(file)}: unexpected PNG format for this check`);
  }

  const channels = header.colorType === 6 ? 4 : 2;
  const stride = header.width * channels;

  let previous = Buffer.alloc(stride);

  for (let row = 0; row < header.height; row += 1) {
    const start = row * (stride + 1);
    const filter = data[start];
    const line = Buffer.from(data.subarray(start + 1, start + 1 + stride));

    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? line[i - channels] : 0;
      const up = previous[i];
      const upLeft = i >= channels ? previous[i - channels] : 0;

      if (filter === 1) line[i] = (line[i] + left) & 0xff;
      else if (filter === 2) line[i] = (line[i] + up) & 0xff;
      else if (filter === 3) line[i] = (line[i] + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) line[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
    }

    for (let x = 0; x < header.width; x += 1) {
      if (line[x * channels + (channels - 1)] !== 255) return true;
    }

    previous = line;
  }
  return false;
}

/** PNG's Paeth predictor: whichever neighbour the gradient points at. */
function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const dLeft = Math.abs(estimate - left);
  const dUp = Math.abs(estimate - up);
  const dUpLeft = Math.abs(estimate - upLeft);
  if (dLeft <= dUp && dLeft <= dUpLeft) return left;
  return dUp <= dUpLeft ? up : upLeft;
}

const problems = [];

for (const name of MUST_BE_TRANSPARENT) {
  const file = path.join(IMAGES, name);
  if (!fs.existsSync(file)) {
    problems.push(`${name} is missing`);
    continue;
  }
  if (!hasTransparency(file)) {
    problems.push(
      `${name} has NO transparent pixels — it will draw a solid box over whatever is behind it ` +
        '(this is the dark-mode white box bug). Rebuild it with scripts/brand-assets.py.',
    );
  }
}

for (const name of MUST_BE_OPAQUE) {
  const file = path.join(IMAGES, name);
  if (!fs.existsSync(file)) {
    problems.push(`${name} is missing`);
    continue;
  }
  if (hasTransparency(file)) {
    problems.push(`${name} has an alpha channel — the App Store rejects an icon with one.`);
  }
}

if (problems.length) {
  console.error('Image check FAILED:\n' + problems.map((line) => `  - ${line}`).join('\n'));
  process.exit(1);
}

console.log(
  `Images OK — ${MUST_BE_TRANSPARENT.length} transparent, ${MUST_BE_OPAQUE.length} opaque, as each needs to be.`,
);
