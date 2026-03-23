import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Employee Checklist | HR Pulse",
};

export default function EmployeeChecklistPage() {
  const screen = getLoadedScreen("employeeChecklist");
  return <PrototypeScreen screen={screen} />;
}

