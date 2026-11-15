import React, { useState, useMemo } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Search, 
  Mic, 
  SlidersHorizontal, 
  Pin, 
  Folder, 
  Clock, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  ShieldCheck, 
  Plus, 
  MoreVertical, 
  Key, 
  FileSpreadsheet, 
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function CloudVaultScreen() {
  const { 
    files, 
    filterCategory, 
    setFilterCategory, 
    searchQuery, 
    setSearchQuery, 
    inspectFile, 
    setUploadModalOpen, 
    storageUsedGB, 
    totalStorageGB,
    showToast 
  } = useVault();

  const [sortOrder, setSortOrder] = useState('date_desc');

  const categories = [
    { id: 'All Files', label: 'All Files', icon: Folder },
    { id: 'Recent', label: 'Recent', icon: Clock },
    { id: 'Images', label: 'Images', icon: ImageIcon },
    { id: 'Documents', label: 'Documents', icon: FileText },
    { id: 'Videos', label: 'Videos', icon: Video },
    { id: 'Encrypted Vault', label: 'Encrypted Vault', icon: ShieldCheck },
  ];

  // Pinned items
  const pinnedFiles = useMemo(() => files.filter(f => f.pinned), [files]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      // Category filter
      if (filterCategory === 'Recent') {
        // Just return all files
      } else if (filterCategory !== 'All Files') {
        if (filterCategory === 'Images' && f.category !== 'Images') return false;
        if (filterCategory === 'Documents' && f.category !== 'Documents') return false;
        if (filterCategory === 'Videos' && f.category !== 'Videos') return false;
        if (filterCategory === 'Encrypted Vault' && f.category !== 'Encrypted Vault') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || (f.typeName && f.typeName.toLowerCase().includes(q));
      }

      return true;
    });
  }, [files, filterCategory, searchQuery]);

  const storagePct = Math.min(100, Math.round((storageUsedGB / totalStorageGB) * 100));

  const getFileIcon = (file) => {
    if (file.type === 'pdf') return <FileText className="w-5 h-5 text-secondary" />;
    if (file.type === 'csv') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (file.type === 'image') return <ImageIcon className="w-5 h-5 text-blue-600" />;
    if (file.type === 'video') return <Video className="w-5 h-5 text-indigo-600" />;
    if (file.type === 'key') return <Key className="w-5 h-5 text-amber-600" />;
    return <FileText className="w-5 h-5 text-secondary" />;
  };

  return (
    <div className="flex flex-col w-full pb-20 relative">
      {/* 1. Storage Quota Glance Banner */}
      <section className="px-4 sm:px-5 pt-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-secondary-container font-mono text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3 text-on-tertiary-container" />
                  Zero-Knowledge Encrypted
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-primary tracking-tight">
                {storageUsedGB} GB of {totalStorageGB} GB used
              </h2>
            </div>
            <button
              onClick={() => showToast('Subscription Tier: Enterprise Tier with 100 GB HSM allocation', 'verified')}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <span>Upgrade</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Linear Gauge */}
          <div className="w-full">
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${storagePct}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1.5 font-mono text-[11px] text-on-surface-variant">
              <span>{storagePct}% allocated</span>
              <span>{(totalStorageGB - storageUsedGB).toFixed(1)} GB available</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Controls */}
      <section className="px-4 sm:px-5 mt-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm px-3 h-11 transition-all focus-within:border-secondary focus-within:shadow-md">
            <Search className="w-4 h-4 text-outline select-none flex-shrink-0" />
            <input
              type="text"
              placeholder="Search encrypted files, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-2.5 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-outline hover:text-primary font-mono mr-1"
              >
                clear
              </button>
            )}
            <button
              onClick={() => showToast('Voice search listening for encrypted tag queries...', 'mic')}
              className="text-outline hover:text-primary transition-colors flex items-center justify-center p-1"
              title="Voice Search"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => showToast('Filters: All cryptographic hashes verified', 'tune')}
            className="h-11 px-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-1.5 text-secondary hover:text-primary hover:bg-surface-container-low transition-colors flex-shrink-0"
            title="Filter & Sort"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Horizontal Pill Filter Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = filterCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-primary-container text-white shadow-sm font-semibold scale-[1.02]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary border border-outline-variant/30 shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Pinned & Recent Section */}
      {pinnedFiles.length > 0 && !searchQuery && (
        <section className="mt-5">
          <div className="px-4 sm:px-5 flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Pin className="w-4 h-4 text-secondary fill-secondary" />
              <h2 className="font-display text-sm sm:text-base font-bold text-primary">
                Pinned &amp; Recent
              </h2>
            </div>
            <span className="font-mono text-xs text-on-surface-variant">
              {pinnedFiles.length} items
            </span>
          </div>

          {/* Horizontal Scrollable Cards */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 sm:px-5">
            {pinnedFiles.map(file => (
              <div
                key={file.id}
                onClick={() => inspectFile(file)}
                className="min-w-[220px] max-w-[240px] bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex flex-col justify-between flex-shrink-0 cursor-pointer hover:shadow-md hover:border-secondary transition-all active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                    {file.securityStatus && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/20 text-on-tertiary-container font-mono text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {file.securityStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xs font-bold text-primary truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                    {file.sizeDisplay} • {file.typeName}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-surface-container text-[11px] text-on-surface-variant font-mono">
                  <span>Modified {file.modified}</span>
                  <Lock className="w-3 h-3 text-on-tertiary-container" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. All Media & Files List */}
      <section className="mt-5 px-4 sm:px-5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-display text-sm sm:text-base font-bold text-primary">
            All Media &amp; Files
          </h2>
          <span className="text-xs text-on-surface-variant font-mono">
            Sort: Date Modified
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => inspectFile(file)}
              className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-secondary cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-display text-xs sm:text-sm font-semibold text-primary truncate" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-on-surface-variant font-mono flex-wrap">
                    <span>{file.sizeDisplay}</span>
                    <span>•</span>
                    <span>{file.modified}</span>
                    {file.securityStatus && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          {file.securityStatus}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    inspectFile(file);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                  title="More Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              <Folder className="w-10 h-10 text-outline mx-auto mb-2 opacity-50" />
              <p className="font-display text-sm font-semibold text-primary">No files match your query</p>
              <p className="text-xs text-on-surface-variant mt-1">Try another category or clear search filter</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (FAB): + New Upload */}
      <button
        onClick={() => setUploadModalOpen(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-primary-container text-white shadow-xl hover:bg-primary transition-all active:scale-95 group border border-secondary/40"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
        <span className="font-display text-xs sm:text-sm font-semibold tracking-wide">
          New Upload
        </span>
      </button>
    </div>
  );
}
