const SALT_LENGTH_BYTES = 16;
const HASH_LENGTH_BYTES = 32;
const PBKDF2_ITERATIONS = 150_000;
const LOCKOUT_BASE_MS = 30_000;

/** Hashes a four-digit PIN with a 16-byte salt and returns 32 derived bytes. */
export async function hashPin(
  pin: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  assertPin(pin);
  assertBytes(salt, SALT_LENGTH_BYTES, "salt");

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is unavailable");

  // Copy into a dedicated ArrayBuffer to satisfy BufferSource and avoid using
  // caller-owned memory as mutable crypto input.
  const saltBuffer = Uint8Array.from(salt).buffer;
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    HASH_LENGTH_BYTES * 8,
  );
  return new Uint8Array(derived);
}

/** Returns whether a PIN derives the supplied 32-byte hash. */
export async function verifyPin(
  pin: string,
  salt: Uint8Array,
  expectedHash: Uint8Array,
): Promise<boolean> {
  assertPin(pin);
  assertBytes(salt, SALT_LENGTH_BYTES, "salt");
  assertBytes(expectedHash, HASH_LENGTH_BYTES, "hash");

  const candidate = await hashPin(pin, salt);
  return constantTimeEqual(candidate, expectedHash);
}

/** True when a well-formed four-digit PIN is one of the specified weak patterns. */
export function isWeakPin(pin: string): boolean {
  assertPin(pin);
  return pin === "0000" || pin === "1234" || /^([0-9])\1{3}$/.test(pin);
}

/**
 * Returns the lock expiry as epoch milliseconds, or null before failure five.
 * The wait starts at 30 seconds on failure five and doubles thereafter.
 */
export function lockoutUntil(failures: number, now: number): number | null {
  if (!Number.isSafeInteger(failures) || failures < 0) {
    throw new RangeError("failures must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(now) || now < 0) {
    throw new RangeError(
      "now must be a non-negative epoch-millisecond timestamp",
    );
  }
  if (failures < 5) return null;

  const delay = LOCKOUT_BASE_MS * 2 ** (failures - 5);
  const until = now + delay;
  if (!Number.isSafeInteger(until)) {
    throw new RangeError("lockout timestamp exceeds the safe integer range");
  }
  return until;
}

function assertPin(pin: string): void {
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    throw new TypeError("PIN must contain exactly four digits");
  }
}

function assertBytes(
  value: Uint8Array,
  expectedLength: number,
  label: string,
): void {
  if (!(value instanceof Uint8Array) || value.byteLength !== expectedLength) {
    throw new TypeError(`${label} must be a ${expectedLength}-byte Uint8Array`);
  }
}

/** Compare equal-length byte arrays without data-dependent early exit. */
function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;

  const leftView = new DataView(left.buffer, left.byteOffset, left.byteLength);
  const rightView = new DataView(
    right.buffer,
    right.byteOffset,
    right.byteLength,
  );
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= leftView.getUint8(index) ^ rightView.getUint8(index);
  }
  return difference === 0;
}
