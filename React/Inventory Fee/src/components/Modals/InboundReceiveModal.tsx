import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { InventoryItem } from "@/types/inventory";
import { api } from "@/lib/api";
import { soundFx } from "@/lib/audio";
import { PlusCircle, PackageCheck } from "lucide-react";

interface InboundReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSuccess: () => void;
}

export function InboundReceiveModal({
  open,
  onOpenChange,
  items,
  onSuccess,
}: InboundReceiveModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(50);
  const [poNumber, setPoNumber] = useState<string>("PO-2026-INBOUND");
  const [operatorId, setOperatorId] = useState<string>("OP-7740");
  const [notes, setNotes] = useState<string>("Verified dock receiving inspection");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;

    try {
      setIsSubmitting(true);
      await api.receiveShipment({
        itemId: selectedItemId,
        quantity,
        poNumber,
        operatorId,
        notes,
      });

      soundFx.playSuccessTone();
      alert(`Received +${quantity} units of ${selectedItem?.sku} into warehouse.`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      soundFx.playErrorTone();
      alert(`Failed to receive shipment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Receive Inbound Shipment"
      description="Record arrival of supplier cartons into warehouse stock. Automatically updates immutable event-sourcing ledger."
    >
      <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">TARGET SKU / ITEM:</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.sku} - {it.title} (Cur: {it.quantityOnHand})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              RECEIVED QUANTITY:
            </label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="h-8 text-xs font-bold text-cyan-300"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">PO / ASN REFERENCE:</label>
            <Input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">RECEIVING OPERATOR:</label>
            <Input
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">PRIMARY DESTINATION:</label>
            <div className="h-8 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center">
              {selectedItem?.primaryLocation?.bin} ({selectedItem?.primaryLocation?.zone})
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">INSPECTION NOTES:</label>
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
            <PackageCheck className="w-3.5 h-3.5" />
            {isSubmitting ? "Receiving..." : "Commit Inbound Receipt"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
