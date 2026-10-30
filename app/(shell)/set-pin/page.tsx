"use client";

import { ClerkRoot } from "@/auth/clerk";
import { SetPinScreen } from "@/ui/auth/PinScreens";

export default function SetPinPage() {
  return (
    <ClerkRoot>
      <SetPinScreen />
    </ClerkRoot>
  );
}
