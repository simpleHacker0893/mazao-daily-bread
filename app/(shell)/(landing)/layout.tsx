import { LandingFooter, LandingHeader } from "@/ui/landing/header-footer";

/** The landing page (/) and /privacy: static pages with the landing header and footer. No Clerk, no data fetching (#22). */
export default function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-chalk">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
