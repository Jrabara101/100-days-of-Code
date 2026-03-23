import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Admin Dashboard | HR Pulse",
};

export default function AdminDashboardPage() {
  const screen = getLoadedScreen("adminDashboard");
  return <PrototypeScreen screen={screen} />;
}

