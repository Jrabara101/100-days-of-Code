import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CLUSTERS } from '../data/seedContacts';
import { useContactStore } from '../store/useContactStore';
import { Contact } from '../types/contact';
import confetti from 'canvas-confetti';

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const AddNodeDialog: React.FC<AddNodeDialogProps> = ({
  open,
  onOpenChange,
  onShowToast,
}) => {
  const addContactOptimistic = useContactStore(
    (state) => state.addContactOptimistic
  );

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('Kinetic Engine Systems');
  const [cluster, setCluster] = useState(CLUSTERS[0].id);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 555 010 8820');
  const [location, setLocation] = useState('Remote, Node 0');
  const [tagsInput, setTagsInput] = useState('#Distributed, #ZeroAlloc');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Alpha Candidate';
    const finalRole = role.trim() || 'Systems Engineer';
    const randomHex = (0x2000 + Math.floor(Math.random() * 0x1000))
      .toString(16)
      .toUpperCase();
    const id = `NODE-${Math.floor(8000 + Math.random() * 2000)}`;
    const idx = `IDX::0x${randomHex}`;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const finalEmail =
      email.trim() ||
      `${finalName.toLowerCase().replace(/\s+/g, '.')}@kinetic.io`;

    const newContact: Contact = {
      id,
      idx,
      name: finalName,
      role: finalRole,
      company: company.trim() || 'Kinetic Engine Systems',
      location: location.trim() || 'Remote, Node 0',
      email: finalEmail,
      phone: phone.trim() || '+1 555 010 8820',
      matrix: `@${finalName.toLowerCase().replace(/\s+/g, '')}:kinetic.internal`,
      latency: Math.floor(6 + Math.random() * 24),
      status: 'online',
      cluster,
      groupId: cluster,
      tags: tags.length > 0 ? tags : ['#Distributed', '#ZeroAlloc'],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${finalName}&backgroundColor=1c1b1d,2a2a2c`,
      notes: [`Provisioned node via Kinetic ledger entry [${idx}].`],
      relationships: [],
      updatedAt: Date.now(),
    };

    addContactOptimistic(newContact);
    onShowToast(`Provisioned Node: ${finalName} (Trie updated in 0.09ms)`);

    confetti({
      particleCount: 35,
      spread: 40,
      origin: { y: 0.7 },
      colors: ['#22d3ee', '#46d89d'],
    });

    onOpenChange(false);
    setName('');
    setRole('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface-container-low border border-outline-variant/30">
        <DialogHeader>
          <DialogTitle className="text-base font-bold font-sans">
            Provision New Node
          </DialogTitle>
          <DialogDescription className="text-xs text-outline font-mono">
            Register new contact entity with zero-alloc Trie insertion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-outline block mb-1">
              Full Name *
            </label>
            <Input
              required
              placeholder="e.g. Elena Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-outline block mb-1">
                Role Title
              </label>
              <Input
                placeholder="e.g. Systems Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="font-sans text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-outline block mb-1">
                Cluster Partition
              </label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 text-xs text-on-surface shadow-sm focus:outline-none focus:border-primary-container font-sans"
              >
                {CLUSTERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-outline block mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="elena.vance@kinetic.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-outline block mb-1">
                Location
              </label>
              <Input
                placeholder="Remote, Node 0"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="font-sans text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-outline block mb-1">
              Bitset Tags (comma separated)
            </label>
            <Input
              placeholder="#Distributed, #ZeroAlloc, #VIP"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Provision Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
