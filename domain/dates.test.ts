import { describe, expect, it } from "vitest";
import {
  isInRange,
  nairobiDayRange,
  resolveDueRule,
  todayInNairobi,
} from "./dates";

describe("nairobiDayRange", () => {
  it("is midnight to midnight EAT (UTC+3) as UTC instants, end exclusive", () => {
    expect(nairobiDayRange("2026-10-26")).toEqual([
      "2026-10-25T21:00:00.000Z",
      "2026-10-26T21:00:00.000Z",
    ]);
  });

  it("puts a record at 00:30 EAT in that EAT day, not the previous one", () => {
    const halfPastMidnight = "2026-10-25T21:30:00.000Z"; // 00:30 EAT on the 26th
    expect(isInRange(halfPastMidnight, nairobiDayRange("2026-10-26"))).toBe(
      true,
    );
    expect(isInRange(halfPastMidnight, nairobiDayRange("2026-10-25"))).toBe(
      false,
    );
  });

  it("keeps the end exclusive", () => {
    expect(
      isInRange("2026-10-26T21:00:00.000Z", nairobiDayRange("2026-10-26")),
    ).toBe(false);
  });
});

describe("todayInNairobi", () => {
  it("is the EAT calendar day of the given instant", () => {
    expect(todayInNairobi(new Date("2026-10-26T20:59:59.000Z"))).toBe(
      "2026-10-26",
    );
    expect(todayInNairobi(new Date("2026-10-26T21:00:00.000Z"))).toBe(
      "2026-10-27",
    );
  });
});

describe("resolveDueRule", () => {
  const monday = "2026-10-26";
  const friday = "2026-10-30";

  it("kesho is tomorrow", () => {
    expect(resolveDueRule("kesho", monday)).toBe("2026-10-27");
    expect(resolveDueRule("kesho", "2026-12-31")).toBe("2027-01-01");
  });

  it("ijumaa is the next Friday; on a Friday it is the Friday after", () => {
    expect(resolveDueRule("ijumaa", monday)).toBe(friday);
    expect(resolveDueRule("ijumaa", friday)).toBe("2026-11-06");
    expect(resolveDueRule("ijumaa", "2026-10-31")).toBe("2026-11-06");
  });

  it("wiki ijayo is seven days on", () => {
    expect(resolveDueRule("wiki_ijayo", monday)).toBe("2026-11-02");
  });

  it("mwisho wa mwezi is the last day of this month", () => {
    expect(resolveDueRule("mwisho_wa_mwezi", monday)).toBe("2026-10-31");
    expect(resolveDueRule("mwisho_wa_mwezi", "2028-02-10")).toBe("2028-02-29");
  });
});
