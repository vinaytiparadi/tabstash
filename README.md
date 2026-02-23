# Quick Archive Browser Extension

Quick Archive is a premium, modern browser extension designed to instantly save your open tabs and restore them later. It helps you keep your browser uncluttered while ensuring you never lose important research or sessions.

## Features
- **Instant Sweep**: Close and save all your current tabs with a single click.
- **Session Management**: View, restore, or delete past sessions in a clean, dark-mode GUI.
- **Privacy First**: All data is saved directly to your local browser storage (`chrome.storage.local`). No cloud telemetry.

## Installation Instructions (Developer Mode)

Since this extension is completely custom and not published to the Chrome/Edge Web Store, you can install it locally using Developer Mode.

### 1. Build the Extension
Ensure you have Node.js installed. Open your terminal in the `d:\Dev\quick_archive` folder and run:
```bash
npm install
npm run build
```
This will compile the extension and generate a `dist` folder.

### 2. Load into Chrome or Edge
1. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
2. Turn on **Developer mode** (usually a toggle in the top right corner or left sidebar).
3. Click the **"Load unpacked"** button.
4. Select the `dist` folder located inside your `d:\Dev\quick_archive` directory.
5. The **Quick Archive** extension will now appear in your list of extensions!

### 3. Usage
- Click the extension puzzle piece icon in your browser toolbar and pin **Quick Archive**.
- Click the **Quick Archive** icon to open the popup.
- Click **"Sweep Tabs"** to archive your current window.
- To restore tabs, click the **Restore Session** icon (the external link icon) on any of your saved archive cards.

## Built With
- React 18 & TypeScript
- Vite & `@crxjs/vite-plugin`
- Tailwind CSS & Radix UI primitives
- Lucide React (Icons)
