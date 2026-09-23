import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { useContactStore } from '../store/useContactStore';
import { FileJson, FileCode, Check } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onShowToast,
}) => {
  const contacts = useContactStore((state) => state.contacts);
  const allIds = useContactStore((state) => state.allIds);

  const exportJSON = () => {
    const dataList = allIds.map((id) => contacts[id]).filter(Boolean);
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(dataList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `kinetic_contacts_trie_dump_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onShowToast(`Exported ${dataList.length.toLocaleString()} nodes to JSON`);
    onOpenChange(false);
  };

  const exportVCard = () => {
    const dataList = allIds.slice(0, 100).map((id) => contacts[id]).filter(Boolean);
    let vCardContent = '';
    for (const c of dataList) {
      vCardContent += `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${c.name}\r\nORG:${c.company}\r\nTITLE:${c.role}\r\nEMAIL;TYPE=INTERNET:${c.email}\r\nTEL;TYPE=CELL:${c.phone}\r\nNOTE:${c.idx} Cluster: ${c.cluster}\r\nEND:VCARD\r\n`;
    }

    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_contacts_${Date.now()}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    onShowToast(`Exported vCard contacts package (.vcf)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface-container-low border border-outline-variant/30">
        <DialogHeader>
          <DialogTitle className="text-base font-bold font-sans">
            Export Spatial Index Dump
          </DialogTitle>
          <DialogDescription className="text-xs text-outline font-mono">
            Download current snapshot of directory node state.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-3">
          <div
            onClick={exportJSON}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high hover:border-primary/50 cursor-pointer transition-all group"
          >
            <FileJson className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-semibold text-on-surface">
              JSON Memory Dump
            </span>
            <span className="text-[10px] font-mono text-outline mt-1 text-center">
              Complete {allIds.length.toLocaleString()} node attributes
            </span>
          </div>

          <div
            onClick={exportVCard}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high hover:border-tertiary/50 cursor-pointer transition-all group"
          >
            <FileCode className="w-8 h-8 text-tertiary mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-semibold text-on-surface">
              vCard (.vcf)
            </span>
            <span className="text-[10px] font-mono text-outline mt-1 text-center">
              Universal address book format
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
