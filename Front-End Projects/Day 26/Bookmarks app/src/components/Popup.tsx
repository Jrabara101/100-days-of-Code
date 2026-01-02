/// <reference types="chrome" />
import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { Button } from './ui/button';
import { ExternalLink, Plus, Loader2 } from 'lucide-react';
import { scrapeCurrentPage } from '../services/scraper';

export const Popup = () => {
    const [currentTab, setCurrentTab] = useState<{ id?: number, title: string, url: string, favIconUrl?: string } | null>(null);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Chrome API might not exist in dev mode
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    setCurrentTab({
                        id: tabs[0].id,
                        title: tabs[0].title || '',
                        url: tabs[0].url || '',
                        favIconUrl: tabs[0].favIconUrl
                    });
                }
            });
        }
    }, []);

    const handleSave = async () => {
        if (currentTab && currentTab.id) {
            setLoading(true);
            try {
                // Scrape metadata
                let metadata;
                try {
                    metadata = await scrapeCurrentPage(currentTab.id);
                } catch (e) {
                    console.error("Scraping failed", e);
                    // Fallback
                    metadata = {
                        title: currentTab.title,
                        url: currentTab.url,
                        image: currentTab.favIconUrl,
                        tags: []
                    };
                }

                await db.bookmarks.add({
                    url: metadata.url || currentTab.url,
                    title: metadata.title || currentTab.title,
                    description: metadata.description,
                    content: metadata.content,
                    createdAt: Date.now(),
                    tags: ['uncategorized'],
                    image: metadata.image || currentTab.favIconUrl
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    const openDashboard = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: 'index.html#/dashboard' });
        } else {
            window.location.hash = '#/dashboard';
        }
    };

    return (
        <div className="w-[350px] bg-background p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Synapse</h2>
                <button onClick={openDashboard} className="text-xs text-primary hover:underline flex items-center gap-1">
                    Open Dashboard <ExternalLink className="h-3 w-3" />
                </button>
            </div>

            <div className="bg-secondary/30 p-3 rounded-md mb-4">
                {currentTab ? (
                    <div>
                        <p className="font-medium text-sm line-clamp-1">{currentTab.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{currentTab.url}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No active tab detected</p>
                )}
            </div>

            <Button onClick={handleSave} disabled={loading || saved} className="w-full mb-2 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? "Saved!" : <><Plus className="h-4 w-4" /> Save to Library</>}
            </Button>
        </div>
    );
};
