import React from "react";
import {
  Layers,
  MapPin,
  TrendingDown,
  ScanBarcode,
  Compass,
  CheckCircle2,
  Lock,
  Boxes,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab =
  | "live-inventory"
  | "digital-twin"
  | "burn-forecaster"
  | "scan-stash"
  | "supplier-radar"
  | "cycle-sentry"
  | "channel-locks";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    criticalCount: number;
    pendingCycleCounts: number;
    activeLocks: number;
  };
}

export function Sidebar({ currentTab, onSelectTab, counts }: SidebarProps) {
  const navItems = [
    {
      id: "live-inventory" as NavTab,
      label: "Live Inventory Grid",
      icon: Layers,
      badge: null,
      desc: "Virtualized SKU ledger",
    },
    {
      id: "digital-twin" as NavTab,
      label: "Digital Twin 2D Mapper",
      icon: MapPin,
      badge: "SPATIAL",
      desc: "Visual shelf & bin heatmaps",
    },
    {
      id: "burn-forecaster" as NavTab,
      label: "Burn-Rate Depletion",
      icon: TrendingDown,
      badge: counts.criticalCount > 0 ? `${counts.criticalCount} DEFICIT` : null,
      badgeVariant: "destructive",
      desc: "Rolling velocity & EOQ POs",
    },
    {
      id: "scan-stash" as NavTab,
      label: "Zero-HW Scan & Stash",
      icon: ScanBarcode,
      badge: "MOBILE HUB",
      badgeVariant: "cyan",
      desc: "Instant camera verification",
    },
    {
      id: "supplier-radar" as NavTab,
      label: "Supplier Drift Radar",
      icon: Compass,
      badge: null,
      desc: "Price creep & reliability audit",
    },
    {
      id: "cycle-sentry" as NavTab,
      label: "Cycle-Count Sentry",
      icon: CheckCircle2,
      badge: counts.pendingCycleCounts > 0 ? `${counts.pendingCycleCounts} DUE` : null,
      badgeVariant: "warning",
      desc: "Micro-audits & shrinkage",
    },
    {
      id: "channel-locks" as NavTab,
      label: "Multi-Channel Locks",
      icon: Lock,
      badge: counts.activeLocks > 0 ? `${counts.activeLocks} HOLDS` : null,
      badgeVariant: "cyan",
      desc: "Synchronized stock pooling",
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between p-3 select-none flex-shrink-0 min-h-[calc(100vh-52px)]">
      <div className="space-y-4">
        {/* Section title */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
            OPERATIONS MATRIX
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1 rounded">
            LIVE
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-all group relative",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-300"
                    )}
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium tracking-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate leading-none mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ml-1.5",
                      item.badgeVariant === "destructive"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : item.badgeVariant === "warning"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Fleet & Automation Status Footer */}
      <div className="mt-4 p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            AUTOMATION MESH
          </span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>

        <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[85%] rounded transition-all duration-500" />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span>AGV FORKLIFTS 16/20</span>
          <span>85% FLEET LOAD</span>
        </div>
      </div>
    </aside>
  );
}
