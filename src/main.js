const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const watcher = require('./watcher');
const db = require('./db');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  const indexHtml = path.join(__dirname, 'renderer', 'index.html');
  mainWindow.loadFile(indexHtml);
}

app.whenReady().then(async () => {
  db.init(); // initialize DB
  createWindow();

  // Start watcher with default folders
  const downloads = app.getPath('downloads');
  const desktop = app.getPath('desktop');
  await watcher.startWatching([downloads, desktop]);

  // Tray
  tray = new Tray(path.join(__dirname, 'build', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Blaze Fire Wall', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Blaze Fire Wall');
  tray.setContextMenu(contextMenu);
});

app.on('window-all-closed', (e) => {
  // keep app running in tray on mac/linux; quit on Windows if desired
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-quarantine-list', async () => {
  return db.listQuarantine();
});

ipcMain.handle('restore-file', async (event, id) => {
  return db.restore(id);
});

ipcMain.handle('delete-file', async (event, id) => {
  return db.delete(id);
});
