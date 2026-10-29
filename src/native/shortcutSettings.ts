import { BrowserWindow } from "electron";

import { config } from "./config";

export function openMicMuteShortcutDialog() {
  const win = new BrowserWindow({
    width: 420,
    height: 180,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "Microphone mute shortcut",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; }
  input { width: 100%; padding: 8px; box-sizing: border-box; }
  button { margin-top: 12px; padding: 8px 12px; }
</style>
</head>
<body>
  <label for="shortcut">Keyboard shortcut (Electron accelerator)</label>
  <input id="shortcut" value="${config.microphoneMuteShortcut}" />
  <button id="save">Save</button>
  <script>
    const { ipcRenderer } = require('electron');
    document.getElementById('save').addEventListener('click', () => {
      const value = document.getElementById('shortcut').value.trim();
      if (value) {
        ipcRenderer.invoke('setMicMuteShortcut', value);
      }
      window.close();
    });
  </script>
</body>
</html>`;

  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
}