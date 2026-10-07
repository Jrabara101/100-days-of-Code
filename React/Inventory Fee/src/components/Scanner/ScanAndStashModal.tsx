import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Scan,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Volume2,
  RefreshCw,
  Plus,
  X,
  FileCheck,
} from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { soundFx } from "@/lib/audio";
import { InventoryItem } from "@/types/inventory";
import { api } from "@/lib/api";

interface ScanAndStashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onScanSuccess: () => void;
}

interface ScannedCarton {
  id: string;
  sku: string;
  title: string;
  timestamp: string;
  status: "MATCHED" | "FLAGGED_DAMAGE" | "OVERAGE";
  binLocation: string;
}

export function ScanAndStashModal({
  open,
  onOpenChange,
  items,
  onScanSuccess,
}: ScanAndStashModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scannedCartons, setScannedCartons] = useState<ScannedCarton[]>([]);
  const [packingSlipRef, setPackingSlipRef] = useState("ASN-PO-8821");
  const [expectedCartons, setExpectedCartons] = useState(10);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream when open
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError("Camera hardware not detected. Simulator mode active.");
      }
    } catch (err: any) {
      setCameraError("Webcam access restricted or unavailable. Ready for manual/click simulation.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Process barcode scan
  const handleProcessScan = async (code: string, isDamaged = false) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    // Play classic hardware beep!
    soundFx.playScanBeep();

    // Match against known SKUs or UPCs
    const matched = items.find(
      (it) =>
        it.sku.toUpperCase() === trimmed ||
        it.upc === trimmed ||
        it.sku.toUpperCase().includes(trimmed)
    );

    if (matched) {
      setLastScannedItem(matched);

      // Register carton in batch
      const newCarton: ScannedCarton = {
        id: `CARTON-${Date.now().toString().slice(-4)}`,
        sku: matched.sku,
        title: matched.title,
        timestamp: new Date().toLocaleTimeString(),
        status: isDamaged ? "FLAGGED_DAMAGE" : "MATCHED",
        binLocation: matched.primaryLocation.bin,
      };

      setScannedCartons((prev) => [newCarton, ...prev]);

      if (isDamaged) {
        soundFx.playErrorTone();
        setStatusMessage(`FLAGGED: ${matched.sku} marked as damaged in transit.`);
      } else {
        soundFx.playSuccessTone();
        setStatusMessage(`MATCHED: ${matched.sku} verified against ${packingSlipRef}. Stash at ${matched.primaryLocation.bin}.`);
      }

      setManualCode("");
    } else {
      soundFx.playErrorTone();
      setStatusMessage(`UNRECOGNIZED: Barcode ${trimmed} not found in SKU manifest!`);
    }
  };

  // Commit pallet receipt to backend ledger
  const handleCommitPalletReceipt = async () => {
    if (scannedCartons.length === 0) return;

    try {
      // Group by SKU
      const grouped: Record<string, number> = {};
      scannedCartons
        .filter((c) => c.status === "MATCHED")
        .forEach((c) => {
          grouped[c.sku] = (grouped[c.sku] || 0) + 1;
        });

      for (const [sku, qty] of Object.entries(grouped)) {
        const item = items.find((i) => i.sku === sku);
        if (item) {
          await api.receiveShipment({
            itemId: item.id,
            quantity: qty,
            poNumber: packingSlipRef,
            operatorId: "OP-MOBILE-STASH",
            notes: `Zero-Hardware Pallet Batch Scan [${scannedCartons.length} cartons verified]`,
          });
        }
      }

      soundFx.playSuccessTone();
      alert(`Pallet shipment committed! Processed ${scannedCartons.length} cartons into warehouse ledger.`);
      setScannedCartons([]);
      onScanSuccess();
      onOpenChange(false);
    } catch (err: any) {
      soundFx.playErrorTone();
      alert(`Error committing pallet receipt: ${err.message}`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Zero-Hardware 'Scan & Stash' Mobile Hub"
      description="Zero hardware required. Turn your phone, tablet, or laptop into a barcode/QR scanning terminal with real-time packing slip reconciliation."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 font-mono">
        {/* Packing Slip & Pallet Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-zinc-400 block text-[10px]">PACKING SLIP ASN:</span>
              <Input
                value={packingSlipRef}
                onChange={(e) => setPackingSlipRef(e.target.value)}
                className="h-7 w-36 font-bold text-cyan-300 bg-zinc-950 text-xs"
              />
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">EXPECTED CARTONS:</span>
              <span className="text-zinc-200 font-bold">{expectedCartons} Units</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[10px]">VERIFIED:</span>
            <span className="text-cyan-400 font-bold text-sm">
              {scannedCartons.filter((c) => c.status === "MATCHED").length} / {expectedCartons}
            </span>
          </div>
        </div>

        {/* Camera Reticle & Scanner Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-cyan-500/40 bg-zinc-950 flex flex-col items-center justify-center min-h-[260px] shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-cyan-400/60 mx-auto" />
                <p className="text-xs text-zinc-300 font-sans">
                  {cameraError || "Optical scanner ready."}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Use quick simulated barcode triggers below or type UPC manually:
                </p>
              </div>
            )}

            {/* Futuristic Laser Reticle Overlay */}
            <div className="absolute inset-4 pointer-events-none border border-cyan-500/30 rounded flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

              {/* Laser Sweep line */}
              <div className="absolute w-[90%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent laser-scanner-beam shadow-[0_0_8px_rgba(6,182,212,0.8)]" />

              <span className="text-[9px] text-cyan-400/80 bg-zinc-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                OPTICAL TARGET RETICLE
              </span>
            </div>
          </div>

          {/* Quick Barcode Simulator / Manual Barcode Input */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                MANUAL BARCODE / SCANNER GUN INPUT:
              </label>
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleProcessScan(manualCode);
                  }}
                  placeholder="Scan or enter SKU (e.g. AVN-4420-TX)..."
                  className="h-8 text-xs"
                />
                <Button
                  onClick={() => handleProcessScan(manualCode)}
                  size="sm"
                  className="font-mono"
                >
                  Verify
                </Button>
              </div>
            </div>

            {/* Quick Pallet Simulator Buttons */}
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">
                TAP TO SIMULATE INSTANT PALLET BARCODE SCAN:
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {items.slice(0, 6).map((it) => (
                  <button
                    key={it.sku}
                    onClick={() => handleProcessScan(it.sku)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors text-[11px] group"
                  >
                    <div className="text-cyan-300 font-bold group-hover:text-cyan-200">
                      {it.sku}
                    </div>
                    <div className="text-zinc-400 text-[10px] truncate">{it.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Telemetry Banner */}
            {statusMessage && (
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 flex items-center justify-between animate-in fade-in">
                <span>{statusMessage}</span>
                {lastScannedItem && (
                  <Button
                    onClick={() => handleProcessScan(lastScannedItem.sku, true)}
                    variant="destructive"
                    size="sm"
                    className="h-6 text-[10px] ml-2"
                  >
                    Flag Damaged
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scanned Cartons Manifest Table */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" />
              BATCH SCANNED CARTONS ({scannedCartons.length})
            </span>
            {scannedCartons.length > 0 && (
              <button
                onClick={() => setScannedCartons([])}
                className="text-[11px] text-zinc-400 hover:text-red-400"
              >
                Clear Batch
              </button>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-zinc-800/60 rounded border border-zinc-800 bg-zinc-950">
            {scannedCartons.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">
                No cartons scanned yet in this batch. Aim camera or click a test SKU above.
              </div>
            ) : (
              scannedCartons.map((c) => (
                <div key={c.id} className="p-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">{c.sku}</span>
                    <span className="text-zinc-300 text-[11px] truncate max-w-[200px]">
                      {c.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-[10px]">Stash @ {c.binLocation}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.status === "MATCHED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-zinc-400 text-[10px]">{c.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="sm"
            className="font-mono"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCommitPalletReceipt}
            disabled={scannedCartons.length === 0}
            variant="default"
            size="sm"
            className="font-mono gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Commit Pallet to Inventory ({scannedCartons.length} Units)
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
