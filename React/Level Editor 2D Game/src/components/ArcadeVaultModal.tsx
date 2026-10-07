import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  GitFork,
  Play,
  UploadCloud,
  CheckCircle2,
  Trophy,
  Skull,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { LevelMap } from '../types/index.js';
import { Button, Badge } from './ui/index.js';
import { sound } from '../utils/audio.js';

interface ArcadeVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMap: LevelMap;
  onLoadMap: (map: LevelMap) => void;
  onForkMap: (forkedMap: LevelMap) => void;
  onPublishCurrentMap: () => Promise<void>;
  isPublishing: boolean;
}

export const ArcadeVaultModal: React.FC<ArcadeVaultModalProps> = ({
  isOpen,
  onClose,
  currentMap,
  onLoadMap,
  onForkMap,
  onPublishCurrentMap,
  isPublishing,
}) => {
  const [mapsList, setMapsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMapDetails, setSelectedMapDetails] = useState<any | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maps');
      if (res.ok) {
        const data = await res.json();
        setMapsList(data.maps || []);
      }
    } catch (err) {
      console.error('Failed to load arcade maps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMaps();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMaps = mapsList.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.tags && m.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleSelectToLoad = async (mapId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/maps/${mapId}`);
      if (res.ok) {
        const data = await res.json();
        onLoadMap(data.map);
        sound.playModeShift(false);
        onClose();
      }
    } catch (err) {
      console.error('Failed to fetch map blueprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async (mapId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/maps/${mapId}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Remix Architect',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Load the newly forked map
        const fetchForked = await fetch(`/api/maps/${data.id}`);
        if (fetchForked.ok) {
          const forkedData = await fetchForked.json();
          onForkMap(forkedData.map);
          sound.playWireConnect();
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to fork map blueprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (mapId: string) => {
    const url = `${window.location.origin}/?map=${mapId}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    sound.playClick();
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121620] border border-[#222B3D] rounded-2xl w-full max-w-4xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#222B3D] flex items-center justify-between bg-[#0E121A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-bold shadow-glowCyan">
              <Trophy className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#F8FAFC]">Arcade Vault Community Blueprints</h2>
              <p className="text-[11px] text-[#64748B]">
                Discover, playtest, fork, and publish authoritative game maps with death heatmaps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#192030]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="px-5 py-3 border-b border-[#222B3D] bg-[#0E121A]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by title, author, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[#222B3D] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMaps}
              disabled={loading}
              className="text-xs"
              title="Refresh Vault Blueprints"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="emerald"
              size="sm"
              onClick={async () => {
                await onPublishCurrentMap();
                fetchMaps();
              }}
              disabled={isPublishing}
              className="text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Active Map'}</span>
            </Button>
          </div>
        </div>

        {/* Maps Grid List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && mapsList.length === 0 ? (
            <div className="text-center py-16 text-[#64748B] text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              <span>Loading Vault Blueprints...</span>
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="text-center py-16 text-[#64748B] text-xs">
              <span>No matching level blueprints found.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMaps.map((m) => {
                const totalRuns = m.clearCount + m.deathCount;
                const clearRate = totalRuns > 0 ? Math.round((m.clearCount / totalRuns) * 100) : 0;

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-[#141A26] border border-[#222B3D] hover:border-cyan-500/50 rounded-xl transition-all duration-150 flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-[#F8FAFC] group-hover:text-cyan-400 transition-colors">
                          {m.title}
                        </span>
                        {m.forkedFromId && (
                          <Badge variant="violet" className="text-[10px]">
                            <GitFork className="w-3 h-3 mr-0.5 inline" /> Forked
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2">
                        {m.description || 'Custom cartographic level blueprint created with Forge2D.'}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                        <span>By: <strong className="text-white">{m.author}</strong></span>
                        <span>•</span>
                        <span>{m.dimensions.widthInTiles}×{m.dimensions.heightInTiles} tiles</span>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="pt-2 border-t border-[#222B3D]/80 flex items-center justify-between">
                      {/* Telemetry pill */}
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="flex items-center gap-1 text-emerald-400" title="Completed Runs">
                          <Trophy className="w-3 h-3" />
                          <span>{m.clearCount}</span>
                        </span>
                        <span className="flex items-center gap-1 text-rose-400" title="Recorded Deaths">
                          <Skull className="w-3 h-3" />
                          <span>{m.deathCount}</span>
                        </span>
                        <span className="text-cyan-400 font-semibold" title="Clear Rate">
                          {clearRate}%
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyShareLink(m.id)}
                          className="p-1.5 rounded-lg bg-[#192030] hover:bg-[#222B3D] text-[#94A3B8] hover:text-white"
                          title="Copy Shareable Map URL"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFork(m.id)}
                          className="h-7 text-xs px-2.5 text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                          title="Fork this map as a new editable clone"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Fork</span>
                        </Button>

                        <Button
                          variant="cyan"
                          size="sm"
                          onClick={() => handleSelectToLoad(m.id)}
                          className="h-7 text-xs px-2.5"
                          title="Load into Studio"
                        >
                          <Play className="w-3 h-3" />
                          <span>Load</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222B3D] bg-[#0E121A] flex items-center justify-between text-xs text-[#64748B]">
          <span>
            {shareCopied ? (
              <span className="text-emerald-400 font-semibold">✓ Short-link copied to clipboard!</span>
            ) : (
              'Every published blueprint includes authoritative seed geometry & telemetry archives.'
            )}
          </span>
          <Button variant="default" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
