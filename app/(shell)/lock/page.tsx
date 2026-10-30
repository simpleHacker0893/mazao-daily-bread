"use client";

import { ClerkRoot } from "@/auth/clerk";
import { LockScreen } from "@/ui/auth/PinScreens";

export default function LockPage() {
  return (
    <ClerkRoot>
      <LockScreen />
    </ClerkRoot>
  );
}
