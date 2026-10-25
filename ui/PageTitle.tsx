/**
 * Page title primitive: one line in the current UI language (D-049), 22px semibold.
 * `onImage` switches to Surface text for pages that sit on a scrimmed photo.
 */
export type PageTitleProps = {
  title: string;
  onImage?: boolean;
};

export function PageTitle({ title, onImage = false }: PageTitleProps) {
  return (
    <h1
      data-variant={onImage ? "on-image" : "default"}
      className={`font-semibold text-[22px] leading-7 ${onImage ? "text-surface" : "text-ink"}`}
    >
      {title}
    </h1>
  );
}
