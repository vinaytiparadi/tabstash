import { useEffect, useState } from "react";
import { Archive, Trash2, ExternalLink, PackageOpen, Loader2, Pencil, Check, X, ArchiveRestore, Settings } from "lucide-react";
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
  const [settings, setSettings] = useState({ restoreInNewWindow: true });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadArchives = () => {
    chrome.storage.local.get(["archives", "settings"], (data: any) => {
      setArchives(data.archives || []);
      if (data.settings) {
        setSettings(data.settings);
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
          </div>
        </div>
      )}

      <ScrollAreaPrimitive.Root className="flex-1 overflow-hidden" type="scroll">
        <ScrollAreaPrimitive.Viewport className="w-full h-full p-4">
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
              {archives.map((archive) => (
                <div key={archive.id} className="group flex flex-col p-3 rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
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
                        <div className="flex flex-1 min-w-0 items-start">
                          <h3 className="font-medium text-sm line-clamp-3 break-words pr-2" title={archive.name} style={{ wordBreak: 'break-word' }}>{archive.name}</h3>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-1">
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
                    <span>{new Date(archive.createdAt).toLocaleDateString()}</span>
                  </div>
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
