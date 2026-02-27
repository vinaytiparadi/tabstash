# TabStash Browser Extension

TabStash is a premium, modern browser extension designed to instantly save your open tabs and restore them later. It helps you keep your browser uncluttered while ensuring you never lose important research or sessions.

## Features
- **Instant Sweep**: Close and save all your current tabs with a single click.
- **Session Management**: View, restore, or delete past sessions in a clean, dark-mode GUI.
- **Archive Editing**: Expand any archive to view, add, or remove individual tabs.
- **Open Tabs Picker**: Browse all open browser tabs and select which to add to an archive.
- **Privacy First**: All data is saved directly to your local browser storage (`chrome.storage.local`). No cloud telemetry.

## Installation Instructions (Developer Mode)

Since this extension is not published to the Chrome/Edge Web Store, you can install it locally using Developer Mode.

### 1. Download the Latest Release
1. Go to the [Releases](https://github.com/vinaytiparadi/tabstash/releases) page.
2. Download the latest `tabstash-vX.X.X.zip` file.
3. Extract the zip to a folder on your computer (e.g. `tabstash-v1.1.0`).

### 2. Load into Chrome or Edge
1. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
2. Turn on **Developer mode** (usually a toggle in the top right corner or left sidebar).
3. Click the **"Load unpacked"** button.
4. Select the **extracted folder** (the one containing `manifest.json`).
5. The **TabStash** extension will now appear in your list of extensions!

### 3. Usage
- Click the extension puzzle piece icon in your browser toolbar and pin **TabStash**.
- Click the **TabStash** icon to open the popup.
- Click **"Sweep Tabs"** to archive your current window.
- To restore tabs, click the **Restore Session** icon on any of your saved archive cards.

## Updating to a New Version

1. Download the latest `tabstash-vX.X.X.zip` from the [Releases](https://github.com/vinaytiparadi/tabstash/releases) page.
2. Extract the zip, replacing the old folder contents.
3. Go to your browser's extensions page (`chrome://extensions/` or `edge://extensions/`).
4. Find **TabStash** and click the **reload** (🔄) icon on the extension card.
5. That's it — your archives and settings are preserved automatically!

## Dismissing the Developer Mode Warning

Since this is a locally loaded extension, your browser may show a warning on startup about running extensions in developer mode. Here's how to dismiss it:

### Chrome
- A banner will appear saying *"Disable developer mode extensions"*. Simply click **✕** to dismiss it each time, or **click "Cancel"** in the dialog.
- Unfortunately Chrome does not allow permanently hiding this warning for unpacked extensions. Just dismiss it on each browser restart.

### Edge
- Edge may show a popup saying *"Turn off developer extensions"*.
- Click the **"..."** (three dots) next to the warning and select **"Don't show again"** — Edge allows you to permanently suppress this warning.
- Alternatively, click **"Keep Developer Extensions On"** to dismiss it.

## Built With
- React 19 & TypeScript
- Vite & `@crxjs/vite-plugin`
- Tailwind CSS & Radix UI primitives
- Lucide React (Icons)
