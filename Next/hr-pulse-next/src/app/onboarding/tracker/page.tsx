import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Onboarding Tracker | HR Pulse",
};

export default function OnboardingTrackerPage() {
  const screen = getLoadedScreen("onboardingTracker");
  return <PrototypeScreen screen={screen} />;
}

