import { useState } from 'react';
import { db } from '../db/db';
import type { Bookmark } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, LayoutGrid, List as ListIcon, Folder, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

export const Dashboard = () => {
    const bookmarks = useLiveQuery(() => db.bookmarks.toArray());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBookmarks = bookmarks?.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">S</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Synapse</h1>
                </div>

                <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                        <Folder className="mr-2 h-4 w-4" /> All Bookmarks
                    </Button>
                    <div className="pt-4">
                        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Smart Views</p>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <span className="mr-2">🎥</span> Videos
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <span className="mr-2">📰</span> Articles
                        </Button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center px-6 gap-4 justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search everything..."
                            className="w-full bg-secondary/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-secondary/50 p-1 rounded-md">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-1.5 rounded-sm transition-colors", viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-background/50")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-sm transition-colors", viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/50")}
                            >
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {filteredBookmarks?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Folder className="h-12 w-12 mb-4 opacity-20" />
                            <p>No bookmarks found</p>
                        </div>
                    ) : (
                        <div className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                            {filteredBookmarks?.map((bookmark) => (
                                <BookmarkCard key={bookmark.id} bookmark={bookmark} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const BookmarkCard = ({ bookmark, viewMode }: { bookmark: Bookmark, viewMode: 'grid' | 'list' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer",
                viewMode === 'list' ? "flex items-center p-3 gap-4 h-24" : "flex flex-col h-64"
            )}
            onClick={() => window.open(bookmark.url, '_blank')}
        >
            {viewMode === 'list' ? (
                <>
                    <div className="h-16 w-24 bg-secondary rounded-md overflow-hidden flex-shrink-0 relative">
                        {bookmark.image ? (
                            <img src={bookmark.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Preview</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate pr-4 text-foreground">{bookmark.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
                        <div className="flex gap-2 mt-1">
                            {bookmark.tags.map(tag => (
                                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="h-32 bg-secondary relative overflow-hidden group-hover:opacity-90 transition-opacity">
                        {bookmark.image ? (
                            <img src={bookmark.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Preview</div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background">
                                <ExternalLink className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold line-clamp-2 mb-1 text-foreground">{bookmark.title}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">{new URL(bookmark.url).hostname}</p>
                        <div className="mt-auto flex flex-wrap gap-1">
                            {bookmark.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
};
