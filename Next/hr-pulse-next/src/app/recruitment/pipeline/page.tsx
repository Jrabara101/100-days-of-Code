import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Recruitment Pipeline | HR Pulse",
};

export default function RecruitmentPipelinePage() {
  const screen = getLoadedScreen("recruitmentPipeline");
  return <PrototypeScreen screen={screen} />;
}

