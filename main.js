const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disk-cache-size', '1');

function profilesPath() {
  return path.join(app.getPath('userData'), 'profiles.json');
}

ipcMain.handle('profiles:load', () => {
  try {
    return JSON.parse(fs.readFileSync(profilesPath(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('profiles:save', (_event, profiles) => {
  if (!Array.isArray(profiles)) return false;
  fs.writeFileSync(profilesPath(), JSON.stringify(profiles, null, 2), 'utf8');
  return true;
});

ipcMain.handle('modrinth:install', async (_event, { projectId, profileName }) => {
  if (!projectId || !profileName) return { success: false, message: 'Missing project or profile.' };
  const versionsResponse = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
  if (!versionsResponse.ok) return { success: false, message: 'Could not find a compatible version.' };
  const versions = await versionsResponse.json();
  const file = versions[0]?.files?.find(candidate => candidate.primary) || versions[0]?.files?.[0];
  if (!file?.url) return { success: false, message: 'No downloadable file was found.' };
  const fileResponse = await fetch(file.url);
  if (!fileResponse.ok) return { success: false, message: 'Download failed.' };
  const safeProfile = profileName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const modsPath = path.join(app.getPath('userData'), 'profiles', safeProfile, 'mods');
  fs.mkdirSync(modsPath, { recursive: true });
  fs.writeFileSync(path.join(modsPath, path.basename(file.filename)), Buffer.from(await fileResponse.arrayBuffer()));
  return { success: true, filename: file.filename };
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 650,
    backgroundColor: '#0b0d0d',
    title: 'C-L0UD CL1ENT',
    icon: path.join(__dirname, 'logo.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  window.loadFile(path.join(__dirname, 'index.html'));
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
