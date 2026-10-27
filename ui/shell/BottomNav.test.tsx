import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "./BottomNav";
import { isActiveRoute } from "./nav";

const pathname = vi.hoisted(() => ({ current: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("BottomNav", () => {
  beforeEach(() => {
    pathname.current = "/dashboard";
  });

  it("shows the five tabs in English only, in order", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav.textContent).toBe("OverviewSalesDebtsExpensesMore");
  });

  it("links the tabs to the English routes", () => {
    render(<BottomNav />);
    const hrefs = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/dashboard", "/sales", "/debts", "/expenses"]);
  });

  it("marks the tab for a nested route as the current page", () => {
    pathname.current = "/sales/new";
    render(<BottomNav />);
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("link", { current: "page" }).textContent).toBe(
      "Sales",
    );
  });

  it("opens More as a button, not a link", () => {
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("isActiveRoute", () => {
  it("matches Overview on /dashboard, never on the landing page (D-055)", () => {
    expect(isActiveRoute("/dashboard", "/dashboard")).toBe(true);
    expect(isActiveRoute("/", "/dashboard")).toBe(false);
    expect(isActiveRoute("/sales", "/dashboard")).toBe(false);
  });

  it("matches nested routes but not look-alike prefixes", () => {
    expect(isActiveRoute("/debts/customer", "/debts")).toBe(true);
    expect(isActiveRoute("/debtsx", "/debts")).toBe(false);
  });
});
