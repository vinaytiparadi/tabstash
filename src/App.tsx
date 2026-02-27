import { useEffect, useState } from "react";
import { Archive, Trash2, ExternalLink, PackageOpen, Loader2, Pencil, Check, X, ArchiveRestore, Settings, SortAsc, SortDesc, Pin, Sun, Moon, Monitor, ChevronDown, ChevronUp, Plus, Globe } from "lucide-react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "./lib/utils";
import type { Archive as ArchiveType } from "./background";

// Simple UI Components
const Button = ({ className, variant = "default", size = "default", ...props }: any) => {
  const variants: any = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  const sizes: any = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    icon: "h-10 w-10",
    xs: "h-7 px-2 text-xs",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

export default function App() {
  const [archives, setArchives] = useState<ArchiveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    restoreInNewWindow: true,
    closeWindowAfterArchiving: false,
    sortField: 'date' as 'date' | 'name',
    sortOrder: 'desc' as 'asc' | 'desc',
    theme: 'system' as 'light' | 'dark' | 'system'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedArchives, setExpandedArchives] = useState<Set<string>>(new Set());
  const [newTabUrls, setNewTabUrls] = useState<Record<string, string>>({});
  const [tabPickerArchiveId, setTabPickerArchiveId] = useState<string | null>(null);
  const [openBrowserTabs, setOpenBrowserTabs] = useState<chrome.tabs.Tab[]>([]);

  const loadArchives = () => {
    chrome.storage.local.get(["archives", "settings"], (data: any) => {
      setArchives(data.archives || []);
      if (data.settings) {
        setSettings({
          restoreInNewWindow: data.settings.restoreInNewWindow ?? true,
          closeWindowAfterArchiving: data.settings.closeWindowAfterArchiving ?? false,
          sortField: data.settings.sortField ?? 'date',
          sortOrder: data.settings.sortOrder ?? 'desc',
          theme: data.settings.theme ?? 'system',
        });
      }
      setLoading(false);
    });
  };

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    await chrome.storage.local.set({ settings: newSettings });
  };

  const startEditing = (archive: ArchiveType) => {
    setEditingId(archive.id);
    setEditName(archive.name);
  };

  const saveRename = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    const updated = archives.map(a => a.id === id ? { ...a, name: editName.trim() } : a);
    await chrome.storage.local.set({ archives: updated });
    setArchives(updated);
    setEditingId(null);
  };

  useEffect(() => {
    loadArchives();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      if (settings.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        return;
      }

      root.classList.add(settings.theme);
    };

    applyTheme();

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  const handleArchive = async () => {
    setArchiving(true);
    await chrome.runtime.sendMessage({ action: "archive_window", name: "" });
    loadArchives();
    setArchiving(false);
  };

  const handleRestore = async (id: string, removeAfter: boolean) => {
    await chrome.runtime.sendMessage({ action: "restore_archive", archiveId: id, removeAfter });
    loadArchives();
  };

  const handleDelete = async (id: string) => {
    const updated = archives.filter((a) => a.id !== id);
    await chrome.storage.local.set({ archives: updated });
    setArchives(updated);
  };

  const togglePin = async (id: string) => {
    const updated = archives.map((a) => {
      if (a.id === id) {
        return { ...a, pinned: !a.pinned };
      }
      return a;
    });
    await chrome.storage.local.set({ archives: updated });
    setArchives(updated);
  };

  const toggleExpand = (id: string) => {
    setExpandedArchives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeTabFromArchive = async (archiveId: string, tabIndex: number) => {
    const archive = archives.find(a => a.id === archiveId);
    if (!archive) return;

    const updatedTabs = [...archive.tabs];
    updatedTabs.splice(tabIndex, 1);

    let updatedArchives;
    if (updatedTabs.length === 0) {
      updatedArchives = archives.filter(a => a.id !== archiveId);
    } else {
      updatedArchives = archives.map(a =>
        a.id === archiveId ? { ...a, tabs: updatedTabs } : a
      );
    }

    await chrome.storage.local.set({ archives: updatedArchives });
    setArchives(updatedArchives);
  };

  const addCurrentTabToArchive = async (archiveId: string) => {
    const archive = archives.find(a => a.id === archiveId);
    if (!archive) return;

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.url) return;

    const newTab = {
      url: activeTab.url,
      title: activeTab.title || "Untitled",
      favIconUrl: activeTab.favIconUrl,
    };

    const updatedArchives = archives.map(a =>
      a.id === archiveId ? { ...a, tabs: [...a.tabs, newTab] } : a
    );

    await chrome.storage.local.set({ archives: updatedArchives });
    setArchives(updatedArchives);
  };

  const addCustomUrlToArchive = async (archiveId: string, url: string) => {
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const archive = archives.find(a => a.id === archiveId);
    if (!archive) return;

    const newTab = {
      url: validUrl,
      title: validUrl,
    };

    const updatedArchives = archives.map(a =>
      a.id === archiveId ? { ...a, tabs: [...a.tabs, newTab] } : a
    );

    await chrome.storage.local.set({ archives: updatedArchives });
    setArchives(updatedArchives);

    setNewTabUrls(prev => ({ ...prev, [archiveId]: "" }));
  };

  const openTabPicker = async (archiveId: string) => {
    if (tabPickerArchiveId === archiveId) {
      setTabPickerArchiveId(null);
      return;
    }
    const tabs = await chrome.tabs.query({});
    const filtered = tabs.filter(t => t.url && !t.url.startsWith('chrome://'));
    setOpenBrowserTabs(filtered);
    setTabPickerArchiveId(archiveId);
  };

  const addOpenTabToArchive = async (archiveId: string, browserTab: chrome.tabs.Tab) => {
    const archive = archives.find(a => a.id === archiveId);
    if (!archive || !browserTab.url) return;

    const newTab = {
      url: browserTab.url,
      title: browserTab.title || "Untitled",
      favIconUrl: browserTab.favIconUrl,
    };

    const updatedArchives = archives.map(a =>
      a.id === archiveId ? { ...a, tabs: [...a.tabs, newTab] } : a
    );

    await chrome.storage.local.set({ archives: updatedArchives });
    setArchives(updatedArchives);
  };

  return (
    <div className="w-[400px] h-[500px] bg-background text-foreground flex flex-col font-sans">
      <header className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <PackageOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">TabStash</h1>
            <p className="text-xs text-muted-foreground">{archives.length} saved sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", showSettings && "bg-accent")}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button onClick={handleArchive} disabled={archiving} size="sm" className="gap-2 shadow-sm">
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            Sweep Tabs
          </Button>
        </div>
      </header>

      {showSettings && (
        <div className="p-4 bg-muted/40 border-b border-border animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded bg-primary/10">
              <Settings className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Restore behavior</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Where to open your saved tab archives</p>
              </div>
              <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm shrink-0">
                <button
                  onClick={() => updateSettings({ ...settings, restoreInNewWindow: true })}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200",
                    settings.restoreInNewWindow
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  New Window
                </button>
                <button
                  onClick={() => updateSettings({ ...settings, restoreInNewWindow: false })}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200",
                    !settings.restoreInNewWindow
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Same Window
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">After sweeping tabs</p>
                <p className="text-[11px] text-muted-foreground leading-tight">What happens after archiving a window</p>
              </div>
              <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm shrink-0">
                <button
                  onClick={() => updateSettings({ ...settings, closeWindowAfterArchiving: false })}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200",
                    !settings.closeWindowAfterArchiving
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Keep Open
                </button>
                <button
                  onClick={() => updateSettings({ ...settings, closeWindowAfterArchiving: true })}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200",
                    settings.closeWindowAfterArchiving
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Close Window
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Theme</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Select your application theme</p>
              </div>
              <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm shrink-0">
                <button
                  onClick={() => updateSettings({ ...settings, theme: 'light' })}
                  className={cn(
                    "px-2 py-1 flex items-center justify-center rounded-md transition-all duration-200",
                    settings.theme === 'light'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  title="Light mode"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSettings({ ...settings, theme: 'dark' })}
                  className={cn(
                    "px-2 py-1 flex items-center justify-center rounded-md transition-all duration-200",
                    settings.theme === 'dark'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  title="Dark mode"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSettings({ ...settings, theme: 'system' })}
                  className={cn(
                    "px-2 py-1 flex items-center justify-center rounded-md transition-all duration-200",
                    settings.theme === 'system'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  title="System theme"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {archives.length > 0 && !loading && (
        <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order by</span>
          <div className="flex items-center gap-2">
            <div className="flex bg-background border border-border rounded-md p-0.5 shadow-sm">
              <button
                onClick={() => updateSettings({ ...settings, sortField: 'date' })}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                  settings.sortField === 'date'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Sort by Date"
              >
                Date
              </button>
              <button
                onClick={() => updateSettings({ ...settings, sortField: 'name' })}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                  settings.sortField === 'name'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Sort by Name"
              >
                Name
              </button>
            </div>
            <button
              onClick={() => updateSettings({ ...settings, sortOrder: settings.sortOrder === 'asc' ? 'desc' : 'asc' })}
              className="flex items-center justify-center h-6 w-6 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm"
              title={settings.sortOrder === 'asc' ? "Ascending" : "Descending"}
            >
              {settings.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      <ScrollAreaPrimitive.Root className="flex-1 overflow-hidden" type="scroll">
        <ScrollAreaPrimitive.Viewport className="w-full h-full p-4 [&>div]:!block overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : archives.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <PackageOpen className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">No archives yet</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">Save your current tabs to unclutter your workspace.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...archives].sort((a, b) => {
                // Pin logic: pinned items always come first
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;

                let comparison = 0;
                if (settings.sortField === 'date') {
                  comparison = a.createdAt - b.createdAt;
                } else {
                  comparison = a.name.localeCompare(b.name);
                }
                return settings.sortOrder === 'desc' ? -comparison : comparison;
              }).map((archive) => (
                <div key={archive.id} className={cn(
                  "group flex flex-col p-3 rounded-lg border shadow-sm transition-all overflow-hidden",
                  archive.pinned
                    ? "border-primary/40 bg-primary/[0.03] hover:border-primary/60"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                )}>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    {editingId === archive.id ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRename(archive.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="flex-1 min-w-0 bg-background border border-border text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 shrink-0" onClick={() => saveRename(archive.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => setEditingId(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-1 min-w-0 items-center gap-1.5">
                          {archive.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0 fill-primary/10" />}
                          <h3 className="font-medium text-sm line-clamp-3 break-words pr-2" title={archive.name} style={{ wordBreak: 'break-word' }}>{archive.name}</h3>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", archive.pinned ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground")}
                            onClick={() => togglePin(archive.id)}
                            title={archive.pinned ? "Unpin Archive" : "Pin Archive"}
                          >
                            <Pin className={cn("w-3.5 h-3.5", archive.pinned && "fill-current")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEditing(archive)} title="Rename Archive">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleRestore(archive.id, false)} title={settings.restoreInNewWindow ? "Open in New Window (Keep Archive)" : "Open in Current Window (Keep Archive)"}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleRestore(archive.id, true)} title={settings.restoreInNewWindow ? "Restore & Delete Archive (New Window)" : "Restore & Delete Archive (Current Window)"}>
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(archive.id)} title="Delete Archive Only">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground justify-between">
                    <div className="flex -space-x-2 overflow-hidden py-1">
                      {archive.tabs.slice(0, 5).map((tab, i) => (
                        <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center overflow-hidden" title={tab.title}>
                          {tab.favIconUrl ? (
                            <img src={tab.favIconUrl} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <div className="w-3 h-3 bg-muted-foreground/30 rounded-full" />
                          )}
                        </div>
                      ))}
                      {archive.tabs.length > 5 && (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[9px] font-medium">
                          +{archive.tabs.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{new Date(archive.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => toggleExpand(archive.id)}
                        className="flex items-center justify-center h-5 w-5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={expandedArchives.has(archive.id) ? "Collapse tabs" : "Expand tabs"}
                      >
                        {expandedArchives.has(archive.id) ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedArchives.has(archive.id) && (
                    <div className="mt-2 space-y-2 border-t border-border pt-2 overflow-hidden">
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {archive.tabs.map((tab, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-muted/50 group/tab overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              {tab.favIconUrl ? (
                                <img src={tab.favIconUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 bg-muted-foreground/30 rounded-full shrink-0" />
                              )}
                              <a href={tab.url} target="_blank" rel="noreferrer" className="block text-xs text-muted-foreground hover:text-foreground hover:underline truncate min-w-0" title={tab.title || tab.url}>
                                {tab.title || tab.url}
                              </a>
                            </div>
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/tab:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeTabFromArchive(archive.id, i)} title="Remove Tab">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 pt-1 border-t border-border/50 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="xs"
                            className="flex-1 text-[10px] h-6 flex items-center gap-1 justify-center"
                            onClick={() => addCurrentTabToArchive(archive.id)}
                          >
                            <Plus className="w-3 h-3" /> Add Current Tab
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className={cn(
                              "flex-1 text-[10px] h-6 flex items-center gap-1 justify-center",
                              tabPickerArchiveId === archive.id && "bg-accent"
                            )}
                            onClick={() => openTabPicker(archive.id)}
                          >
                            <Globe className="w-3 h-3" /> Open Tabs
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 overflow-hidden">
                          <input
                            type="text"
                            placeholder="Add custom URL..."
                            value={newTabUrls[archive.id] || ""}
                            onChange={(e) => setNewTabUrls(prev => ({ ...prev, [archive.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addCustomUrlToArchive(archive.id, newTabUrls[archive.id] || ""); }}
                            className="flex-1 min-w-0 bg-background border border-border text-[10px] rounded px-2 py-1 outline-none focus:border-ring h-6"
                          />
                          <Button
                            variant="default"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => addCustomUrlToArchive(archive.id, newTabUrls[archive.id] || "")}
                            disabled={!newTabUrls[archive.id]?.trim()}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        {tabPickerArchiveId === archive.id && (
                          <div className="space-y-0.5 max-h-[150px] overflow-y-auto rounded border border-border bg-background p-1">
                            {openBrowserTabs.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground text-center py-2">No open tabs found</p>
                            ) : (
                              openBrowserTabs.map((bt) => (
                                <button
                                  key={bt.id}
                                  className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-accent text-left overflow-hidden transition-colors"
                                  onClick={() => addOpenTabToArchive(archive.id, bt)}
                                  title={bt.title || bt.url}
                                >
                                  {bt.favIconUrl ? (
                                    <img src={bt.favIconUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 bg-muted-foreground/30 rounded-full shrink-0" />
                                  )}
                                  <span className="text-[10px] text-foreground truncate min-w-0">{bt.title || bt.url}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex touch-none select-none transition-colors hover:bg-accent/50 w-2.5 border-l border-l-transparent p-[1px]">
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border hover:bg-muted-foreground/50 transition-colors" />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
    </div>
  );
}
