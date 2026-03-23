import { readFileSync } from "node:fs";
import path from "node:path";

type ModuleName = "Recruitment" | "Onboarding" | "Leave Tracker" | "Dashboard";

export type ScreenKey =
  | "adminDashboard"
  | "recruitmentPipeline"
  | "candidateProfile"
  | "onboardingTracker"
  | "employeeChecklist"
  | "teamLeaveCalendar";

export type ScreenDefinition = {
  key: ScreenKey;
  title: string;
  route: string;
  module: ModuleName;
  description: string;
  sourceFolder: string;
};

const definitions: ScreenDefinition[] = [
  {
    key: "adminDashboard",
    title: "Admin Dashboard",
    route: "/admin/dashboard",
    module: "Dashboard",
    description: "Central HR metrics and operational overview for admins.",
    sourceFolder: "hr_pulse_admin_dashboard",
  },
  {
    key: "recruitmentPipeline",
    title: "Recruitment Pipeline",
    route: "/recruitment/pipeline",
    module: "Recruitment",
    description: "Kanban-style applicant tracking for open roles.",
    sourceFolder: "hr_pulse_recruitment_pipeline",
  },
  {
    key: "candidateProfile",
    title: "Candidate Profile",
    route: "/recruitment/candidate-profile",
    module: "Recruitment",
    description: "Detailed candidate view with activity and evaluation sections.",
    sourceFolder: "hr_pulse_candidate_profile",
  },
  {
    key: "onboardingTracker",
    title: "Onboarding Tracker",
    route: "/onboarding/tracker",
    module: "Onboarding",
    description: "Readiness tracking and status visibility for new hires.",
    sourceFolder: "hr_pulse_onboarding_tracker",
  },
  {
    key: "employeeChecklist",
    title: "Employee Checklist",
    route: "/onboarding/employee-checklist",
    module: "Onboarding",
    description: "Employee self-service onboarding progress and tasks.",
    sourceFolder: "hr_pulse_employee_checklist",
  },
  {
    key: "teamLeaveCalendar",
    title: "Team Leave Calendar",
    route: "/leave/team-calendar",
    module: "Leave Tracker",
    description: "Manager-focused team leave calendar and schedule visibility.",
    sourceFolder: "hr_pulse_team_leave_calendar",
  },
];

const definitionsByKey = new Map(definitions.map((screen) => [screen.key, screen]));

export type LoadedScreen = ScreenDefinition & {
  bodyClassName: string;
  styleBlocks: string;
  bodyContent: string;
};

const defaultBodyClassName =
  "bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased";

function extractBodyContent(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1]?.trim() ?? html.trim();
}

function extractBodyClassName(html: string) {
  const match = html.match(/<body[^>]*class=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? defaultBodyClassName;
}

function extractStyleBlocks(html: string) {
  const blocks = html.match(/<style[\s\S]*?<\/style>/gi);
  return blocks?.join("\n") ?? "";
}

export function getScreenDefinitions() {
  return definitions;
}

export function getLoadedScreen(key: ScreenKey): LoadedScreen {
  const screen = definitionsByKey.get(key);

  if (!screen) {
    throw new Error(`Unknown screen key "${key}".`);
  }

  const sourcePath = path.resolve(
    process.cwd(),
    "..",
    "HR Portal",
    screen.sourceFolder,
    "code.html",
  );
  const html = readFileSync(sourcePath, "utf8");

  return {
    ...screen,
    bodyClassName: extractBodyClassName(html),
    styleBlocks: extractStyleBlocks(html),
    bodyContent: extractBodyContent(html),
  };
}
