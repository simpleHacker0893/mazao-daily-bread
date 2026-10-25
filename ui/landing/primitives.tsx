import Link from "next/link";
import type { ReactNode } from "react";

// Where the landing actions go. /sign-in arrives with Clerk (step 11); /demo with D-051.
export const landingRoutes = {
  start: "/sign-in",
  signIn: "/sign-in",
  demo: "/demo",
  privacy: "/privacy",
} as const;

// Q-011: placeholder until the owner supplies the real support number.
export const supportHref = "https://wa.me/254700000000";

// Press feedback: one pixel down, 100 ms, nothing under reduced motion.
const press =
  "transition-[translate,background-color] duration-100 ease-out active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0";
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";

const variants = {
  primary: "bg-sukuma text-surface hover:bg-sukuma-pressed",
  secondary: "border-2 border-sukuma text-sukuma hover:bg-surface",
  text: "text-sukuma underline-offset-4 hover:underline",
} as const;

type ActionProps = {
  href: string;
  children: ReactNode;
  variant: keyof typeof variants;
  size?: "md" | "lg";
};

/** A landing action. Prefetch is off so the page never spends the merchant's data on routes they may not open. */
export function Action({ href, children, variant, size = "md" }: ActionProps) {
  const height = size === "lg" ? "min-h-[52px] px-6 text-lg" : "min-h-12 px-3";
  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-card font-bold ${height} ${variants[variant]} ${press} ${focusRing}`}
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

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-8 ${className}`}>
      {children}
    </div>
  );
}
