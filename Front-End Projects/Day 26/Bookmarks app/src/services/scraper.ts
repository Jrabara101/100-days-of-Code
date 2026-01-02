/// <reference types="chrome" />

export interface PageMetadata {
    title: string;
    url: string;
    description?: string;
    image?: string;
    favicon?: string;
    content?: string;
}

export const scrapeCurrentPage = async (tabId: number): Promise<PageMetadata> => {
    if (!chrome.scripting) {
        throw new Error("Scripting API not available");
    }

    const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            const getMeta = (prop: string) => document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');
            // Handle relative URLs for images/favicons
            const resolveUrl = (url?: string | null) => url ? new URL(url, window.location.href).href : undefined;

            return {
                title: getMeta('og:title') || document.title,
                description: getMeta('og:description') || getMeta('description'),
                image: resolveUrl(getMeta('og:image')),
                favicon: resolveUrl(document.querySelector('link[rel="icon"]')?.getAttribute('href') || document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href')),
                url: window.location.href,
                content: document.body.innerText.substring(0, 10000) // Cap content size for now
            };
        }
    });

    return result.result as PageMetadata;
}
