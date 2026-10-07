import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { InventoryItem, LocationBin } from "@/types/inventory";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import { ArrowRightLeft } from "lucide-react";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  bins: LocationBin[];
  initialItem?: InventoryItem | null;
  onSuccess: () => void;
}

export function TransferModal({
  open,
  onOpenChange,
  items,
  bins,
  initialItem,
  onSuccess,
}: TransferModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItem?.id || items[0]?.id || "");
  const [sourceBinId, setSourceBinId] = useState<string>(
    initialItem?.primaryLocation?.id || bins[0]?.id || ""
  );
  const [destBinId, setDestBinId] = useState<string>(bins[1]?.id || "");
  const [quantity, setQuantity] = useState<number>(10);
  const [operatorId, setOperatorId] = useState<string>("OP-7740");
  const [notes, setNotes] = useState<string>("Warehouse zone rebalancing transfer");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !sourceBinId || !destBinId || quantity <= 0) return;
    if (sourceBinId === destBinId) {
      alert("Source bin and destination bin must be different.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.transferBin({
        itemId: selectedItemId,
        sourceBinId,
        destinationBinId: destBinId,
        quantity,
        operatorId,
        notes,
      });

      soundFx.playSuccessTone();
      alert(`Successfully transferred ${quantity} units from ${sourceBinId} to ${destBinId}.`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      soundFx.playErrorTone();
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer Between Locations"
      description="Relocate items between warehouse bins, shelves, and climate zones with real-time capacity checks."
    >
      <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">SELECT ITEM TO TRANSFER:</label>
          <select
            value={selectedItemId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedItemId(id);
              const found = items.find((i) => i.id === id);
              if (found) setSourceBinId(found.primaryLocation.id);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.sku} - {it.title} (Available: {it.quantityAvailable})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">SOURCE BIN:</label>
            <select
              value={sourceBinId}
              onChange={(e) => setSourceBinId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none"
            >
              {bins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} ({b.bin} - {b.shelf})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">DESTINATION BIN:</label>
            <select
              value={destBinId}
              onChange={(e) => setDestBinId(e.target.value)}
              className="w-full bg-zinc-900 border border-cyan-500/40 rounded p-2 text-zinc-200 text-xs focus:outline-none"
            >
              {bins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} ({b.bin} - {b.capacityUsed}/{b.capacityMax}u)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">TRANSFER QUANTITY:</label>
            <Input
              type="number"
              min="1"
              max={selectedItem?.quantityAvailable || 100}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="h-8 font-bold text-cyan-300"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">FORKLIFT OPERATOR:</label>
            <Input
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">TRANSFER REASON / NOTES:</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-xs"
          />
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
            disabled={isSubmitting || quantity <= 0}
            variant="default"
            size="sm"
            className="gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {isSubmitting ? "Transferring..." : "Execute Bin Transfer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
