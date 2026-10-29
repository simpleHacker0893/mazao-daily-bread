"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useState } from "react";
import { DemoOverview } from "./demo-overview";

const NormalAppShell = dynamic(
  () => import("./NormalAppShell").then((module) => module.NormalAppShell),
  { ssr: false },
);

/**
 * Read the demo flag before mounting the normal authenticated shell. The neutral first render
 * prevents Clerk (or any normal page interaction) from mounting during demo navigation.
 */
export function SessionAwareAppShell({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDemo(window.sessionStorage.getItem("mazao.demo") === "1");
    } catch {
      setDemo(false);
    }
  }, []);

  if (demo === null) return <div className="min-h-dvh flex-1 bg-chalk" />;
  if (demo) return <DemoOverview />;

  return <NormalAppShell>{children}</NormalAppShell>;
}
