import * as React from 'react';
import { Image, PenTool, Video, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { exportPNG, exportSVG, CanvasVideoRecorder, VectorStroke } from '@/lib/exporters';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  vectorStrokes: VectorStroke[];
  inverted: boolean;
}

export function ExportModal({
  open,
  onClose,
  canvas,
  vectorStrokes,
  inverted
}: ExportModalProps) {
  const [isExportingPng, setIsExportingPng] = React.useState(false);
  const [selectedScale, setSelectedScale] = React.useState<1 | 2 | 4>(2);
  const [isRecordingWebM, setIsRecordingWebM] = React.useState(false);
  const [recordTimeLeft, setRecordTimeLeft] = React.useState(4);
  const videoRecorderRef = React.useRef<CanvasVideoRecorder>(new CanvasVideoRecorder());
  const timerRef = React.useRef<number | null>(null);

  // PNG Export Handler
  const handleExportPNG = async () => {
    if (!canvas) return;
    setIsExportingPng(true);
    try {
      const filename = `aetherflow-art-${selectedScale}x-${Date.now()}.png`;
      await exportPNG(canvas, selectedScale, filename);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPng(false);
    }
  };

  // SVG Export Handler (for pen plotters & laser cutters)
  const handleExportSVG = () => {
    if (!canvas) return;
    const filename = `aetherflow-plotter-${Date.now()}.svg`;
    exportSVG(vectorStrokes, canvas.width, canvas.height, inverted, filename);
  };

  // WebM Video Record Handler
  const handleToggleRecord = () => {
    if (!canvas) return;
    const recorder = videoRecorderRef.current;

    if (isRecordingWebM) {
      recorder.stopRecording();
      setIsRecordingWebM(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsRecordingWebM(true);
      setRecordTimeLeft(4);
      recorder.startRecording(canvas, () => {
        setIsRecordingWebM(false);
      });

      // Countdown 4 seconds of looping capture
      let count = 4;
      timerRef.current = window.setInterval(() => {
        count--;
        setRecordTimeLeft(count);
        if (count <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          recorder.stopRecording();
          setIsRecordingWebM(false);
        }
      }, 1000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Museum-Grade Art Exporters"
      description="Export lossless archival prints, laser cutter / AxiDraw pen-plotter vector paths, or high-definition looping videos."
    >
      <div className="space-y-5 pt-1 text-white">
        {/* Section 1: Lossless Master PNG Print */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Image className="w-4 h-4" />
              Lossless Archival PNG
            </span>
            <span className="text-[11px] text-white/50">Crystal Sharp</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { scale: 1 as const, label: '1x Screen', sub: 'Standard' },
              { scale: 2 as const, label: '2x 4K UHD', sub: 'Retina/Display' },
              { scale: 4 as const, label: '4x 8K Print', sub: 'Exhibition Master' },
            ].map((opt) => (
              <button
                key={opt.scale}
                onClick={() => setSelectedScale(opt.scale)}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  selectedScale === opt.scale
                    ? 'border-cyan-400/80 bg-cyan-500/15 text-white shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-[10px] text-white/50 mt-0.5">{opt.sub}</div>
              </button>
            ))}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportPNG}
            disabled={isExportingPng}
            className="w-full gap-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border-cyan-400/40 text-cyan-100"
          >
            {isExportingPng ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Upscaling & Rendering...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Export {selectedScale}x PNG Master</span>
              </>
            )}
          </Button>
        </div>

        {/* Section 2: Vector SVG for Pen Plotters & Laser Cutters */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <PenTool className="w-4 h-4" />
              Pen-Plotter & Laser SVG
            </span>
            <span className="text-[11px] text-white/50">{vectorStrokes.length} vectors</span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Exports pure vector polylines formatted for physical plotters (AxiDraw), vinyl cutters, and CNC laser engravers.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSVG}
            disabled={vectorStrokes.length === 0}
            className="w-full gap-1.5 hover:bg-purple-500/20 hover:border-purple-400/40"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Download Vector SVG ({vectorStrokes.length} paths)</span>
          </Button>
        </div>

        {/* Section 3: Looping 60fps WebM Video */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              Kinetic WebM Video Loop
            </span>
            <span className="text-[11px] text-white/50">60 FPS</span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Record a 4-second seamless animated video loop directly from the canvas stream for social media or live displays.
          </p>
          <Button
            variant={isRecordingWebM ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleRecord}
            className="w-full gap-1.5"
          >
            {isRecordingWebM ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Recording Video... ({recordTimeLeft}s left)</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 text-pink-400" />
                <span>Record 4s 60fps WebM Loop</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
