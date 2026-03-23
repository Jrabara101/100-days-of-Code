import type { Metadata } from "next";
import PrototypeScreen from "@/components/prototype-screen";
import { getLoadedScreen } from "@/lib/prototype-screens";

export const metadata: Metadata = {
  title: "Candidate Profile | HR Pulse",
};

export default function CandidateProfilePage() {
  const screen = getLoadedScreen("candidateProfile");
  return <PrototypeScreen screen={screen} />;
}

