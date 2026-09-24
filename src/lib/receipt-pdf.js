import { brand, light as palette } from '@/theme/brand';

/**
 * The deposit receipt as a PDF the agent can hand to the customer.
 *
 * Sharing used to send a line of TEXT — a message anyone could retype, which
 * is worthless as proof that money was paid in. A customer asking for a
 * receipt wants a document: `expo-print` renders the HTML below to a real PDF
 * and `expo-sharing` hands it to WhatsApp, email, Drive or a printer.
 *
 * Two rules, both about not lying on paper:
 *   * every value comes from the SERVER's response, never from what was typed
 *     into the form — what the ledger recorded is the only thing worth
 *     printing;
 *   * a `Pending` deposit prints as pending, in amber, with a line saying the
 *     money has not reached the account yet. A receipt that claims otherwise
 *     is the most expensive thing this screen could get wrong.
 *
 * Every label is PASSED IN, already translated. This file contains no
 * user-facing English (the app's i18n rule), so the receipt prints in the
 * language the agent is working in.
 */

/**
 * `expo-print` renders this in a WebView, so the styling is inline and plain —
 * no stylesheet, no flexbox tricks, nothing that needs a modern engine.
 *
 * Colours come from the LIGHT palette: a receipt is on white paper whatever
 * theme the phone is in, and `src/theme/brand.js` stays the one place a colour
 * is written down.
 */
export function buildReceiptHtml({
  posted,
  logo,
  documentTitle,
  subtitle,
  amountLabel,
  amount,
  status,
  note,
  rows = [],
  footer,
}) {
  const accent = posted ? palette.success : palette.warning;

  const detail = rows
    .filter((row) => row && row.value)
    .map(
      (row) => `
        <tr>
          <td style="padding:11px 0;color:${palette.inkMuted};font-size:13px;">${escape(row.label)}</td>
          <td style="padding:11px 0;text-align:right;font-size:13px;font-weight:600;color:${palette.ink};">${escape(row.value)}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="margin:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:${palette.ink};">
    <div style="max-width:520px;margin:0 auto;padding:36px 30px;">

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td>
            ${
              logo
                ? `<img src="${logo}" style="height:34px;" alt="${escape(brand.appName)}" />`
                : `<div style="font-size:17px;font-weight:700;color:${palette.primary};">${escape(brand.appName)}</div>`
            }
            <div style="margin-top:6px;font-size:12px;color:${palette.inkMuted};">${escape(subtitle)}</div>
          </td>
          <td style="text-align:right;font-size:12px;color:${palette.inkMuted};">${escape(documentTitle)}</td>
        </tr>
      </table>

      <div style="margin-top:26px;padding:22px;border-radius:14px;background:${palette.background};text-align:center;">
        <div style="font-size:11px;letter-spacing:.7px;text-transform:uppercase;color:${palette.inkMuted};">${escape(amountLabel)}</div>
        <div style="margin-top:8px;font-size:30px;font-weight:700;">${escape(amount)}</div>
        <div style="margin-top:12px;">
          <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:${accent}1A;color:${accent};font-size:12px;font-weight:700;">${escape(status)}</span>
        </div>
      </div>

      ${
        note
          ? `<div style="margin-top:18px;padding:13px 15px;border-radius:10px;background:${accent}14;color:${accent};font-size:12px;line-height:18px;">${escape(note)}</div>`
          : ''
      }

      <table style="width:100%;margin-top:22px;border-collapse:collapse;">${detail}</table>

      <div style="margin-top:26px;padding-top:14px;border-top:1px dashed ${palette.line};text-align:center;font-size:11px;line-height:17px;color:${palette.inkMuted};">${escape(footer)}</div>
    </div>
  </body>
</html>`;
}

/**
 * The logo as a `data:` URI, for the PDF's letterhead.
 *
 * The HTML is rendered in a WebView that cannot reach the app's bundled
 * assets, so the image has to travel inside the document. Best effort: a
 * receipt with the name typed out is worth far more than no receipt, so every
 * failure here falls back to text rather than throwing.
 */
export async function logoDataUri() {
  try {
    const { Asset } = require('expo-asset');
    const FileSystem = require('expo-file-system/legacy');

    // The LIGHT lockup: a receipt is on white paper, whatever the phone's theme.
    const asset = Asset.fromModule(brand.logo.light);
    await asset.downloadAsync();
    if (!asset.localUri) return null;

    const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

/** A customer's name is data, not markup. */
function escape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render the PDF and open the share sheet.
 *
 * Resolves false when the phone has nothing to share with, so the caller can
 * say so rather than appearing to do nothing. Throws only on a real failure,
 * which the caller reports.
 *
 * Guarded requires, like `lib/device.js`: a dev client built before these
 * native modules were added still OPENS the receipt, it just cannot share it.
 */
export async function shareReceiptPdf({ html, fileName, dialogTitle }) {
  const Print = loadPrint();
  const Sharing = loadSharing();
  if (!Print || !Sharing) return false;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(await named(uri, fileName), {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
  return true;
}

/**
 * expo-print names its output after a temporary id, so the customer receives
 * `8a3f2c….pdf`. Renaming is the difference between a file they can find again
 * and one they cannot. Best effort: if the move fails, share the original
 * rather than losing the receipt over its name.
 */
async function named(uri, fileName) {
  if (!fileName) return uri;

  try {
    const FileSystem = require('expo-file-system/legacy');
    const folder = FileSystem.cacheDirectory;
    if (!folder) return uri;

    const to = `${folder}${fileName}`;
    await FileSystem.deleteAsync(to, { idempotent: true });
    await FileSystem.moveAsync({ from: uri, to });
    return to;
  } catch {
    return uri;
  }
}

// Literal paths: Metro only bundles `require('...')` with a string literal.
function loadPrint() {
  try {
    return require('expo-print');
  } catch {
    return null;
  }
}

function loadSharing() {
  try {
    return require('expo-sharing');
  } catch {
    return null;
  }
}
