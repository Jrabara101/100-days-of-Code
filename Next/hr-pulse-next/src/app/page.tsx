import Link from "next/link";
import { getScreenDefinitions } from "@/lib/prototype-screens";

const moduleOrder = ["Dashboard", "Recruitment", "Onboarding", "Leave Tracker"] as const;

export default function HomePage() {
  const screens = getScreenDefinitions();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">HR Pulse Prototype</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Enterprise HR Portal Screens</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          This Next app renders your original HTML prototypes for Recruitment, Onboarding, and
          Leave tracking as navigable routes.
        </p>

        <div className="mt-10 grid gap-6">
          {moduleOrder.map((moduleName) => {
            const moduleScreens = screens.filter((screen) => screen.module === moduleName);
            if (!moduleScreens.length) {
              return null;
            }

            return (
              <section
                key={moduleName}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur"
              >
                <h2 className="text-xl font-semibold">{moduleName}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {moduleScreens.map((screen) => (
                    <Link
                      key={screen.key}
                      href={screen.route}
                      className="rounded-xl border border-slate-700 bg-slate-900 p-4 transition hover:border-sky-400"
                    >
                      <p className="text-base font-semibold text-slate-100">{screen.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{screen.description}</p>
                      <p className="mt-3 text-xs text-sky-300">{screen.route}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

