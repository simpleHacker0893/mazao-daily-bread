import Link from "next/link";
import type { ReactNode } from "react";

// Where the landing actions go: Clerk's sign-up and sign-in pages, and the public demo (D-051).
export const landingRoutes = {
  start: "/sign-up",
  signIn: "/sign-in",
  demo: "/demo",
  privacy: "/privacy",
} as const;

// Q-011: placeholder until the owner supplies the real support number.
export const supportHref = "https://wa.me/254700000000";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";

// Headings: rem so they grow with the phone's text size, capped by vw so 200% text never overflows 360 px.
export const sectionTitle =
  "font-extrabold text-[min(2rem,10vw)] text-ink leading-[1.1] tracking-tight md:text-5xl";
export const displayTitle =
  "font-extrabold text-[min(3rem,13vw)] text-ink leading-none tracking-tight md:text-6xl lg:text-7xl";

// Press feedback only: one pixel down in 100 ms, nothing under reduced motion. Colour changes are instant.
const press =
  "transition-[translate] duration-100 ease-out active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0";

const variants = {
  primary: "bg-sukuma text-surface hover:bg-sukuma-pressed",
  secondary: "border-2 border-sukuma text-sukuma hover:bg-surface",
  text: "text-sukuma underline-offset-4 hover:underline",
} as const;

// lg is the 52 px primary of the hero and closing band; header keeps 52 px with tighter sides for 360 px.
const sizes = {
  md: "min-h-12 px-3",
  // Header actions: tight sides below 768 px so the brand and both actions share one 360 px row.
  headerText: "min-h-12 px-2 md:px-3",
  header: "min-h-[52px] px-3 md:px-5",
  lg: "min-h-[52px] px-6 text-lg",
} as const;

type ActionProps = {
  href: string;
  children: ReactNode;
  variant: keyof typeof variants;
  size?: keyof typeof sizes;
};

/** A landing action. Prefetch is off so the page never spends the merchant's data on routes they may not open. */
export function Action({ href, children, variant, size = "md" }: ActionProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center justify-center text-center rounded-card font-bold sm:whitespace-nowrap ${sizes[size]} ${variants[variant]} ${press} ${focusRing}`}
    >
      {children}
    </Link>
  );
}

// Pre-encoded WebP files in public/images/landing (each 150 KB or less): <name>-640.webp and
// <name>-1200.webp. The numbers are each file's real pixel size.
const photos = {
  "mama-mboga-stall": { small: [640, 478], large: [1200, 896] },
  "notebook-hands": { small: [640, 478], large: [1200, 896] },
  "gikomba-aisle": { small: [640, 357], large: [1200, 670] },
  "duka-shelf": { small: [640, 640], large: [1024, 1024] },
  "boda-rider": { small: [640, 640], large: [1024, 1024] },
  "phone-fundi-kiosk": { small: [640, 640], large: [1024, 1024] },
} as const;

export type PhotoName = keyof typeof photos;

type LandingImageProps = {
  name: PhotoName;
  alt: string;
  sizes: string;
  className?: string;
  /** Only the hero photo loads eagerly; every other photo waits until it is scrolled near. */
  eager?: boolean;
};

export function LandingImage({
  name,
  alt,
  sizes,
  className = "",
  eager = false,
}: LandingImageProps) {
  const { small, large } = photos[name];
  const base = `/images/landing/${name}`;
  return (
    // biome-ignore lint/performance/noImgElement: next/image serves from the /_next/image server route, which the service worker can't precache for offline use. These files are already optimised.
    <img
      src={`${base}-640.webp`}
      srcSet={`${base}-640.webp ${small[0]}w, ${base}-1200.webp ${large[0]}w`}
      sizes={sizes}
      width={large[0]}
      height={large[1]}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={`bg-line object-cover ${className}`}
    />
  );
}

const widths = {
  page: "max-w-[1200px]",
  reading: "max-w-[760px]",
} as const;

export function Container({
  children,
  width = "page",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full px-5 md:px-8 lg:px-10 ${widths[width]} ${className}`}
    >
      {children}
    </div>
  );
}

const tones = {
  chalk: "bg-chalk",
  surface: "border-line border-y bg-surface",
  // Deni and warnings colour (globals.css), as a quiet band.
  maize: "bg-maize-tint",
} as const;

export type Tone = keyof typeof tones;

/**
 * One landing section with the shared vertical rhythm. Two Chalk sections in a row share
 * one gap instead of doubling it (`.landing-section` in globals.css).
 */
export function Section({
  tone,
  labelledBy,
  className = "py-16 lg:py-24",
  children,
}: {
  tone: Tone;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-tone={tone}
      className={`landing-section ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}
