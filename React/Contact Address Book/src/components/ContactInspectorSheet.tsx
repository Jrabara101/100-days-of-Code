import React, { useState, useEffect } from 'react';
import { useContactStore } from '../store/useContactStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/Sheet';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { CLUSTERS } from '../data/seedContacts';
import {
  Mail,
  Phone,
  Copy,
  Trash2,
  Plus,
  X,
  Share2,
  Clock,
  Check,
  Send,
} from 'lucide-react';

interface ContactInspectorSheetProps {
  onShowToast: (msg: string) => void;
}

export const ContactInspectorSheet: React.FC<ContactInspectorSheetProps> = ({
  onShowToast,
}) => {
  const isOpen = useContactStore((state) => state.isInspectorOpen);
  const setOpen = useContactStore((state) => state.setInspectorOpen);
  const selectedContactId = useContactStore((state) => state.selectedContactId);
  const contacts = useContactStore((state) => state.contacts);
  const updateContactOptimistic = useContactStore(
    (state) => state.updateContactOptimistic
  );
  const deleteContactOptimistic = useContactStore(
    (state) => state.deleteContactOptimistic
  );
  const selectContact = useContactStore((state) => state.selectContact);

  const contact = selectedContactId ? contacts[selectedContactId] : null;

  // Local form state for inline editing
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [cluster, setCluster] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [matrix, setMatrix] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRole(contact.role);
      setCompany(contact.company);
      setCluster(contact.cluster);
      setEmail(contact.email);
      setPhone(contact.phone);
      setLocation(contact.location);
      setMatrix(contact.matrix);
      setTags(contact.tags || []);
    }
  }, [contact]);

  if (!contact) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    updateContactOptimistic(selectedContactId, {
      name,
      role,
      company,
      cluster,
      groupId: cluster,
      email,
      phone,
      location,
      matrix,
      tags,
    });

    onShowToast(`Mutated node: ${name} (Trie updated in 0.11ms)`);
  };

  const handleAddTag = () => {
    const clean = newTagInput.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!tags.includes(formatted)) {
      const nextTags = [...tags, formatted];
      setTags(nextTags);
      if (selectedContactId) {
        updateContactOptimistic(selectedContactId, { tags: nextTags });
      }
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    if (selectedContactId) {
      updateContactOptimistic(selectedContactId, { tags: nextTags });
    }
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim() || !selectedContactId) return;
    const existingNotes = contact.notes || [];
    const nextNotes = [newNoteInput.trim(), ...existingNotes];
    updateContactOptimistic(selectedContactId, { notes: nextNotes });
    setNewNoteInput('');
    onShowToast(`Appended telemetry log for ${contact.name}`);
  };

  const handleCopyIdentifier = () => {
    navigator.clipboard.writeText(
      `${contact.name} <${contact.email}> [${contact.idx}]`
    );
    setCopied(true);
    onShowToast(`Copied identifier: ${contact.name}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!selectedContactId) return;
    deleteContactOptimistic(selectedContactId);
    onShowToast(`Decommissioned node: ${contact.name}`);
    setOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-surface-container-low border-l border-outline-variant/30 flex flex-col p-0 overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-6 border-b border-outline-variant/30 bg-surface-container/60 shrink-0">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-primary/40 object-cover shadow-md"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-container ${
                    contact.status === 'online'
                      ? 'bg-tertiary-container shadow-[0_0_8px_rgba(70,216,157,1)]'
                      : 'bg-outline'
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <SheetTitle className="text-lg font-bold text-on-surface font-sans">
                  {contact.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-primary font-mono">
                  {contact.idx} • {contact.id}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary">{contact.cluster}</Badge>
                  <span className="text-[10px] font-mono text-tertiary">
                    {contact.latency}ms ping
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Action Ribbon */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => onShowToast(`Signal sent to ${contact.email}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Ping Mail</span>
            </button>
            <button
              onClick={() => onShowToast(`Call placed to ${contact.phone}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-tertiary" />
              <span>Voice</span>
            </button>
            <button
              onClick={handleCopyIdentifier}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-tertiary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
                NODE ATTRIBUTES (OPTIMISTIC)
              </span>
              <Button type="submit" variant="primary" size="sm">
                Save Mutation
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Role Title
                </label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Company / Entity
                </label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Cluster Partition
                </label>
                <select
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 text-xs text-on-surface shadow-sm focus:outline-none focus:border-primary-container"
                >
                  {CLUSTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Email Signal
                </label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Encrypted Phone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Spatial Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-outline uppercase block mb-1">
                  Matrix Handle
                </label>
                <Input
                  value={matrix}
                  onChange={(e) => setMatrix(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </form>

          {/* Interactive Tag Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
                BITSET SEARCH TAGS
              </span>
              <span className="font-mono text-[10px] text-primary">
                INSTANT TRIE LINK
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-surface-container rounded-lg border border-outline-variant/30">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-xs font-mono text-primary border border-primary/30"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add tag (e.g. #Security, #Rust)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="font-mono text-xs"
              />
              <Button type="button" onClick={handleAddTag} size="sm" variant="secondary">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Relationship Topology */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-secondary" />
                <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
                  TOPOLOGY RELATIONSHIPS
                </span>
              </div>
              <span className="font-mono text-[10px] text-secondary">
                {contact.relationships?.length || 0} LINKED NODES
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {contact.relationships?.map((rel, idx) => (
                <div
                  key={idx}
                  onClick={() => selectContact(rel.targetId)}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <span className="font-sans text-xs font-medium text-on-surface">
                      {rel.name}
                    </span>
                    <span className="font-mono text-[10px] text-outline">
                      [{rel.targetId}]
                    </span>
                  </div>
                  <Badge variant="secondary">{rel.relation.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log & Telemetry Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tertiary" />
                <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
                  ACTIVITY & TELEMETRY LOG
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Log activity event or note..."
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                className="font-sans text-xs"
              />
              <Button type="button" onClick={handleAddNote} size="sm" variant="secondary">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {contact.notes?.map((note, index) => (
                <div
                  key={index}
                  className="p-2 rounded bg-surface-container/70 border border-outline-variant/20 text-xs font-mono text-on-surface-variant flex items-start gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-tertiary mt-1.5 shrink-0" />
                  <span className="flex-1">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decommission Danger Zone */}
          <div className="pt-4 border-t border-error/20 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-xs text-error font-semibold">
                DECOMMISSION NODE
              </span>
              <span className="font-sans text-[11px] text-on-surface-variant">
                Permanently purge entity from spatial memory index
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Purge
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
