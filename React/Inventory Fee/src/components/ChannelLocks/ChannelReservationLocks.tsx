import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Store,
  Globe,
  Building2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ReservationLock, InventoryItem } from "@/types/inventory";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";

interface ChannelLocksProps {
  locks: ReservationLock[];
  items: InventoryItem[];
  onLocksUpdated: () => void;
}

export function ChannelReservationLocks({
  locks,
  items,
  onLocksUpdated,
}: ChannelLocksProps) {
  const [selectedSku, setSelectedSku] = useState<string>(items[0]?.sku || "");
  const [selectedChannel, setSelectedChannel] = useState<
    "SHOPIFY" | "AMAZON" | "B2B_WHOLESALE" | "SHOWROOM"
  >("SHOPIFY");
  const [quantityInput, setQuantityInput] = useState<number>(3);
  const [ttlMinutes, setTtlMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Remaining time calculator
  const calculateRemainingSeconds = (expiresAt: string) => {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCreateLock = async () => {
    const item = items.find((i) => i.sku === selectedSku);
    if (!item) return;

    try {
      setIsSubmitting(true);
      await api.createReservation({
        itemId: item.id,
        sku: item.sku,
        quantity: quantityInput,
        channel: selectedChannel,
        orderRef: `CART-${selectedChannel.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        ttlMinutes: ttlMinutes,
      });

      soundFx.playScanBeep();
      alert(`Lock placed! Reserved ${quantityInput} units of ${item.sku} for ${selectedChannel}.`);
      onLocksUpdated();
    } catch (err: any) {
      soundFx.playErrorTone();
      alert(`Could not place reservation lock: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommitLock = async (lockId: string) => {
    try {
      await api.commitReservation(lockId, "OP-CHECKOUT-DISPATCH");
      soundFx.playSuccessTone();
      alert("Order checkout committed! Stock permanently deducted as OUTBOUND pick.");
      onLocksUpdated();
    } catch (err: any) {
      alert(`Failed to commit lock: ${err.message}`);
    }
  };

  const handleReleaseLock = async (lockId: string) => {
    try {
      await api.releaseReservation(lockId, "USER_ABANDONED_CART");
      soundFx.playScanBeep();
      alert("Cart hold released! Stock returned to unallocated available pool.");
      onLocksUpdated();
    } catch (err: any) {
      alert(`Failed to release lock: ${err.message}`);
    }
  };

  const activeLocks = locks.filter((l) => l.status === "ACTIVE");
  const totalLockedUnits = activeLocks.reduce((acc, l) => acc + l.quantity, 0);

  const channelIcons = {
    SHOPIFY: Globe,
    AMAZON: ShoppingCart,
    B2B_WHOLESALE: Building2,
    SHOWROOM: Store,
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Multi-Channel Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {(["SHOPIFY", "AMAZON", "B2B_WHOLESALE", "SHOWROOM"] as const).map((channel) => {
          const Icon = channelIcons[channel];
          const channelLocks = activeLocks.filter((l) => l.channel === channel);
          const channelUnits = channelLocks.reduce((sum, l) => sum + l.quantity, 0);

          return (
            <div
              key={channel}
              className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {channel.replace("_", " ")}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              <div className="text-xl font-bold text-white tabular-nums">
                {channelUnits} <span className="text-xs font-normal text-zinc-400">Locked Units</span>
              </div>

              <div className="text-[10px] text-zinc-400">
                {channelLocks.length} Active Checkout Funnels
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator & Active Holds Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Holds Table */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300 pb-1">
            <span className="font-semibold uppercase flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" />
              Active Concurrency Reservation Holds ({activeLocks.length})
            </span>
            <span className="text-[10px] text-zinc-400">
              Auto-released via backend 15-min TTL sweeps
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950">
            {activeLocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No active checkout reservation holds right now. Test the simulator on the right!
              </div>
            ) : (
              activeLocks.map((lock) => {
                const Icon = channelIcons[lock.channel];
                return (
                  <div
                    key={lock.id}
                    className="p-3 hover:bg-zinc-900/40 transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{lock.sku}</span>
                        <span className="text-zinc-100 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {lock.quantity} Units Held
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1">
                          <Icon className="w-3 h-3 text-cyan-400" />
                          {lock.channel}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        Ref: <span className="text-zinc-300">{lock.orderRef}</span> • Hold ID: {lock.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400">TTL Remaining</div>
                        <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {calculateRemainingSeconds(lock.expiresAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => handleCommitLock(lock.id)}
                          variant="cyan"
                          size="sm"
                          className="h-7 text-[11px]"
                          title="Simulate customer paying and completing order"
                        >
                          Commit Order
                        </Button>
                        <Button
                          onClick={() => handleReleaseLock(lock.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-zinc-400 hover:text-red-300"
                          title="Release hold back to available pool"
                        >
                          Release
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-Time Simulator Input */}
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3.5 shadow-xl">
          <div className="border-b border-zinc-800 pb-2.5">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
              OMNICHANNEL LOCK SIMULATOR
            </span>
            <h3 className="text-xs font-semibold text-zinc-200 mt-0.5">
              Trigger Instant Checkout Cart Hold
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">SELECT SKU:</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {items.map((it) => (
                  <option key={it.sku} value={it.sku}>
                    {it.sku} - Avail: {it.quantityAvailable} ({it.title.slice(0, 28)}...)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                SALES CHANNEL RETICLE:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["SHOPIFY", "AMAZON", "B2B_WHOLESALE", "SHOWROOM"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChannel(ch)}
                    className={`p-2 rounded text-[11px] text-center border transition-colors ${
                      selectedChannel === ch
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {ch.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">HOLD QUANTITY:</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Number(e.target.value))}
                  className="h-8 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">TTL MINUTES:</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={ttlMinutes}
                  onChange={(e) => setTtlMinutes(Number(e.target.value))}
                  className="h-8 font-mono"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateLock}
              disabled={isSubmitting || quantityInput <= 0}
              variant="default"
              size="lg"
              className="w-full font-mono text-xs gap-1.5 mt-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {isSubmitting ? "Locking Pool..." : "Engage Active Hold"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
