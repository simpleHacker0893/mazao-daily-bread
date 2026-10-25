import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { landing as enLanding } from "@/i18n/en.landing";
import { privacy as enPrivacy } from "@/i18n/en.privacy";
import { landing as swLanding } from "@/i18n/sw.landing";
import { privacy as swPrivacy } from "@/i18n/sw.privacy";

// A stub t() that returns the key, so any text that is not a key stands out.
vi.mock("@/i18n/t", () => ({ t: (key: string) => key }));

const { default: LandingLayout } = await import(
  "@/app/(shell)/(landing)/layout"
);
const { default: LandingPage, metadata: landingMeta } = await import(
  "@/app/(shell)/(landing)/page"
);
const { default: PrivacyPage, metadata: privacyMeta } = await import(
  "@/app/(shell)/(landing)/privacy/page"
);

const halves = [
  ["landing", enLanding, swLanding],
  ["privacy", enPrivacy, swPrivacy],
] as const;
const knownKeys = new Set([
  ...Object.keys(enLanding),
  ...Object.keys(enPrivacy),
]);

function visibleStrings(root: HTMLElement): string[] {
  const strings: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text) strings.push(text);
  }
  for (const element of root.querySelectorAll("*")) {
    for (const attribute of ["alt", "aria-label", "title"]) {
      const value = element.getAttribute(attribute);
      if (value !== null) strings.push(value);
    }
  }
  return strings;
}

function renderInLayout(page: ReactElement) {
  return render(
    <LandingLayout params={Promise.resolve({})}>{page}</LandingLayout>,
  );
}

describe("landing and privacy i18n", () => {
  for (const [prefix, en, sw] of halves) {
    it(`every ${prefix}.* key has a non-empty English and Kiswahili value`, () => {
      for (const [key, value] of Object.entries(en)) {
        expect(key.startsWith(`${prefix}.`), key).toBe(true);
        expect(value.trim(), key).not.toBe("");
        expect((sw as Record<string, string>)[key]?.trim(), key).toBeTruthy();
      }
    });
  }

  for (const [path, Page, metadata] of [
    ["/", LandingPage, landingMeta],
    ["/privacy", PrivacyPage, privacyMeta],
  ] as const) {
    it(`${path} shows no text, alt, aria label or meta that bypasses i18n`, () => {
      const { container } = renderInLayout(<Page />);
      const strings = [
        ...visibleStrings(container),
        String(metadata.title),
        String(metadata.description),
      ];
      expect(strings.length).toBeGreaterThan(10);
      expect(strings.filter((text) => !knownKeys.has(text))).toEqual([]);
    });
  }
});
