export interface TabInfo {
    url: string;
    title: string;
    favIconUrl?: string;
}

export interface Archive {
    id: string;
    name: string;
    createdAt: number;
    tabs: TabInfo[];
}

// Helper to sweep and archive current window
async function archiveCurrentWindow(name: string) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    // Filter out the new tab page or extension pages if desired, but for now we keep all except maybe chrome:// pages if not allowed
    const tabInfos: TabInfo[] = tabs
        .filter((tab: chrome.tabs.Tab) => tab.url && !tab.url.startsWith("chrome://"))
        .map((tab: chrome.tabs.Tab) => ({
            url: tab.url!,
            title: tab.title || "Untitled",
            favIconUrl: tab.favIconUrl,
        }));

    if (tabInfos.length === 0) return;

    const newArchive: Archive = {
        id: crypto.randomUUID(),
        name: name || `Archive - ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        tabs: tabInfos,
    };

    // Save to storage
    const data = await chrome.storage.local.get("archives");
    const archives: Archive[] = (data.archives as Archive[]) || [];
    archives.unshift(newArchive);
    await chrome.storage.local.set({ archives });

    // Open a new tab so the window doesn't close
    await chrome.tabs.create({});

    // Close all old tabs
    const tabIds = tabs.map((t: chrome.tabs.Tab) => t.id).filter((id: number | undefined) => id !== undefined) as number[];
    await chrome.tabs.remove(tabIds);
}

// Restore an archive
async function restoreArchive(archiveId: string, removeAfter: boolean = false) {
    const data = await chrome.storage.local.get("archives");
    const archives: Archive[] = (data.archives as Archive[]) || [];
    const archive = archives.find((a) => a.id === archiveId);

    if (!archive) return;

    // Create new window with the tabs
    const urls = archive.tabs.map((t: TabInfo) => t.url);
    await chrome.windows.create({ url: urls });

    // Optionally remove the archive
    if (removeAfter) {
        const updatedArchives = archives.filter((a) => a.id !== archiveId);
        await chrome.storage.local.set({ archives: updatedArchives });
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.action === "archive_window") {
        archiveCurrentWindow(message.name).then(() => sendResponse({ success: true }));
        return true; // Keep the message channel open for async response
    }

    if (message.action === "restore_archive") {
        restoreArchive(message.archiveId, message.removeAfter).then(() => sendResponse({ success: true }));
        return true;
    }
});
