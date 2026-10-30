// Share the day's plain-text summary. Nothing is logged and nothing leaves the phone except
// through the share sheet or the clipboard the merchant chooses.
export type ShareResult = "shared" | "copied" | "cancelled" | "manual";

export async function shareSummary(text: string): Promise<ShareResult> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Any other failure falls back to the clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "manual";
  }
}
