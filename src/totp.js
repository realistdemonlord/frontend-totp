/**
 * Pure frontend TOTP (RFC 6238) implementation using Web Crypto API.
 * No backend, no storage — everything lives in memory only.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode a Base32-encoded string into a Uint8Array.
 */
export function base32Decode(input) {
  const clean = input.replace(/[\s=-]+/g, '').toUpperCase();
  const len = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((len * 5) / 8));

  for (let i = 0; i < len; i++) {
    const charIndex = BASE32_CHARS.indexOf(clean[i]);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output.slice(0, index);
}

/**
 * Convert an integer to an 8-byte big-endian ArrayBuffer.
 */
function intToBytes(num) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // JavaScript bitwise ops work on 32 bits, so handle high/low parts
  const low = num & 0xffffffff;
  const high = Math.floor(num / 0x100000000) & 0xffffffff;
  view.setUint32(0, high);
  view.setUint32(4, low);
  return buf;
}

/**
 * Generate a TOTP code.
 * @param {string} secret - Base32-encoded secret
 * @param {number} [timeStep=30] - Time step in seconds
 * @param {number} [digits=6] - Number of digits
 * @returns {Promise<string>} - The TOTP code, zero-padded
 */
export async function generateTOTP(secret, timeStep = 30, digits = 6) {
  const key = base32Decode(secret);
  if (key.length === 0) throw new Error('Invalid secret');

  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  const counterBytes = intToBytes(counter);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hmacArray = new Uint8Array(hmac);

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hmacArray[hmacArray.length - 1] & 0x0f;
  const binary =
    ((hmacArray[offset] & 0x7f) << 24) |
    ((hmacArray[offset + 1] & 0xff) << 16) |
    ((hmacArray[offset + 2] & 0xff) << 8) |
    (hmacArray[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Get remaining seconds in the current TOTP period.
 */
export function getRemainingSeconds(timeStep = 30) {
  return timeStep - (Math.floor(Date.now() / 1000) % timeStep);
}
