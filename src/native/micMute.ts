import { globalShortcut, ipcMain } from "electron";

import { config } from "./config";
import { mainWindow } from "./window";

let currentAccelerator = "";
let lastTrigger = 0;

async function toggleMicrophoneMute() {
  const now = Date.now();
  if (now - lastTrigger < 1000) {
    return;
  }
  lastTrigger = now;
  console.info("[micMute] Shortcut triggered");
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // notify the renderer / web app that the shortcut was triggered
  mainWindow.webContents.send("toggleMicrophoneMute");

  // also dispatch an event into the page so the web app can react
  // without needing a dedicated IPC listener
  try {
    const clicked = await mainWindow.webContents.executeJavaScript(
      "(() => { try { window.dispatchEvent(new CustomEvent('stoat:toggle-microphone-mute')); " +
        "const btn = Array.from(document.querySelectorAll('button')).find(b => /mic/i.test(b.textContent || '') || /mute/i.test(b.getAttribute('aria-label') || '')); " +
        "if (btn) { btn.click(); return 'clicked'; } return 'no-button'; } " +
        "catch (e) { return 'error: ' + (e && e.message ? e.message : e); } })()",
    );
    console.info("[micMute] Clicked button:", clicked);
  } catch (error) {
    console.warn("[micMute] Failed to toggle in page:", error);
  }
}

export function registerMicMuteShortcut() {
  unregisterMicMuteShortcut();

  const accelerator = config.microphoneMuteShortcut?.trim();
  if (!accelerator) return;

  try {
    const ok = globalShortcut.register(accelerator, toggleMicrophoneMute);
    if (ok) {
      currentAccelerator = accelerator;
      console.info("[micMute] Registered shortcut:", accelerator);
    } else {
      console.warn("[micMute] Failed to register shortcut:", accelerator);
    }
  } catch (error) {
    console.warn("[micMute] Invalid shortcut:", accelerator, error);
  }
}

export function unregisterMicMuteShortcut() {
  if (currentAccelerator) {
    try {
      globalShortcut.unregister(currentAccelerator);
    } catch {
      // ignore
    }
    currentAccelerator = "";
  }
}

export function initMicMuteShortcut() {
  registerMicMuteShortcut();

  // re-register whenever the config (and thus the shortcut) changes
  ipcMain.on("config", () => {
    registerMicMuteShortcut();
  });
}

// allow callers to change the shortcut programmatically
ipcMain.handle("setMicMuteShortcut", (_, accelerator: string) => {
  config.microphoneMuteShortcut = accelerator;
  registerMicMuteShortcut();
  return config.microphoneMuteShortcut;
});

ipcMain.handle("getMicMuteShortcut", () => config.microphoneMuteShortcut);