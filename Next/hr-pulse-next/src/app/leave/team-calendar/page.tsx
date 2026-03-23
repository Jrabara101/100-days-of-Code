import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Team Leave Calendar | HR Pulse",
};

export default function TeamLeaveCalendarPage() {
  const screen = getLoadedScreen("teamLeaveCalendar");
  return <PrototypeScreen screen={screen} />;
}

