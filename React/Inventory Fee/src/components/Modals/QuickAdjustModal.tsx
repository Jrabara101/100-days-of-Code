import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { InventoryItem } from "@/types/inventory";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import { SlidersHorizontal } from "lucide-react";

interface QuickAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export function QuickAdjustModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: QuickAdjustModalProps) {
  const [delta, setDelta] = useState<number>(0);
  const [reasonType, setReasonType] = useState<"CYCLE_COUNT" | "SCRAP" | "OUTBOUND">("CYCLE_COUNT");
  const [operatorId, setOperatorId] = useState<string>("OP-7740");
  const [notes, setNotes] = useState<string>("Routine micro-audit reconciliation");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      alert("Adjustment delta cannot be 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.adjustStock({
        itemId: item.id,
        delta,
        reasonType,
        operatorId,
        notes,
      });

      soundFx.playSuccessTone();
      alert(`Stock adjusted by ${delta > 0 ? "+" : ""}${delta} units for ${item.sku}.`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      soundFx.playErrorTone();
      alert(`Adjustment failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Adjust Stock - ${item.sku}`}
      description={item.title}
    >
      <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-400">CURRENT ON HAND:</span>
          <span className="text-sm font-bold text-white">
            {item.quantityOnHand} {item.unitOfMeasure}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              QUANTITY DELTA (+ or -):
            </label>
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="h-8 font-bold text-cyan-300"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">MUTATION TYPE:</label>
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200 text-xs focus:outline-none"
            >
              <option value="CYCLE_COUNT">CYCLE_COUNT (Micro-Audit)</option>
              <option value="SCRAP">SCRAP (Damage / Defect)</option>
              <option value="OUTBOUND">OUTBOUND (Floor Usage)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">AUDIT JUSTIFICATION:</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-xs"
            required
          />
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[11px]">
          <span className="text-zinc-400">PROJECTED NEW BALANCE:</span>
          <span
            className={`font-bold ${
              item.quantityOnHand + delta < item.reorderPoint ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {item.quantityOnHand + delta} {item.unitOfMeasure}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || delta === 0}
            variant="default"
            size="sm"
            className="gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isSubmitting ? "Adjusting..." : "Record Adjustment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
