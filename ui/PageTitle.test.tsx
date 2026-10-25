import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageTitle } from "./PageTitle";

describe("PageTitle", () => {
  it("renders the title as the page heading", () => {
    render(<PageTitle title="Overview" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Overview" }),
    ).toBeInTheDocument();
  });

  it("shows one language only, with no caption beneath (D-049)", () => {
    const { container } = render(<PageTitle title="Sales" />);
    expect(container.textContent).toBe("Sales");
  });

  it("marks the on-image variant for scrimmed screens", () => {
    render(<PageTitle title="Enter your PIN" onImage />);
    expect(screen.getByRole("heading")).toHaveAttribute(
      "data-variant",
      "on-image",
    );
  });
});
