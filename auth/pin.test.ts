import { describe, expect, it } from "vitest";
import { hashPin, isWeakPin, lockoutUntil, verifyPin } from "./pin";

const salt = (start: number): Uint8Array =>
  Uint8Array.from({ length: 16 }, (_, index) => start + index);

describe("PIN core", () => {
  it("hashes and verifies a PIN, producing 32 bytes", async () => {
    const derived = await hashPin("2468", salt(1));
    expect(derived).toBeInstanceOf(Uint8Array);
    expect(derived.byteLength).toBe(32);
    await expect(verifyPin("2468", salt(1), derived)).resolves.toBe(true);
  });

  it("does not verify a different PIN or a different salt", async () => {
    const firstSalt = salt(1);
    const firstHash = await hashPin("2468", firstSalt);
    const secondHash = await hashPin("2468", salt(2));

    expect(await verifyPin("1357", firstSalt, firstHash)).toBe(false);
    expect(Array.from(secondHash)).not.toEqual(Array.from(firstHash));
    expect(await verifyPin("2468", salt(2), firstHash)).toBe(false);
  });

  it.each(["0000", "1234", "7777"])('rejects weak PIN "%s"', (pin) => {
    expect(isWeakPin(pin)).toBe(true);
  });

  it.each(["2468", "1209", "9998"])('accepts ordinary PIN "%s"', (pin) => {
    expect(isWeakPin(pin)).toBe(false);
  });

  it.each([
    [4, 0],
    [5, 30_000],
    [6, 60_000],
    [7, 120_000],
  ])("computes the lockout after %i failures", (failures, delay) => {
    const now = 1_800_000_000_000;
    const result = lockoutUntil(failures, now);
    expect(result).toBe(delay === 0 ? null : now + delay);
  });

  it("rejects malformed PINs, salts, and stored hashes", async () => {
    await expect(hashPin("123", salt(1))).rejects.toThrow();
    await expect(hashPin("12x4", salt(1))).rejects.toThrow();
    await expect(hashPin("1234", new Uint8Array(15))).rejects.toThrow();
    await expect(
      verifyPin("1234", salt(1), new Uint8Array(31)),
    ).rejects.toThrow();
    expect(() => isWeakPin(" 1234")).toThrow();
  });

  it("rejects invalid failure counts and timestamps", () => {
    expect(() => lockoutUntil(-1, 0)).toThrow();
    expect(() => lockoutUntil(5.5, 0)).toThrow();
    expect(() => lockoutUntil(5, Number.NaN)).toThrow();
  });
});
