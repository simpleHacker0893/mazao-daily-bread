import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { landing as enLanding } from "@/i18n/en.landing";
import { landing as swLanding } from "@/i18n/sw.landing";

// A stub t() that returns the key, so any text that is not a key stands out.
vi.mock("@/i18n/t", () => ({ t: (key: string) => key }));

const { default: WelcomePage } = await import("@/app/(shell)/welcome/page");

const landingKeys = new Set(Object.keys(enLanding));

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

describe("landing i18n", () => {
  it("every landing key has an English and a Kiswahili value", () => {
    for (const key of landingKeys) {
      expect(key.startsWith("landing."), key).toBe(true);
      expect(enLanding[key as keyof typeof enLanding].trim(), key).not.toBe("");
      expect(swLanding[key as keyof typeof swLanding].trim(), key).not.toBe("");
    }
  });

  it("/welcome shows no text, alt or aria label that bypasses i18n", () => {
    const { container } = render(<WelcomePage />);
    const strings = visibleStrings(container);
    expect(strings.length).toBeGreaterThan(20);
    expect(strings.filter((text) => !landingKeys.has(text))).toEqual([]);
  });
});
