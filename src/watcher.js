const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const db = require('./db');

const quarantineDirName = 'blaze_quarantine';

async function ensureQuarantineDir() {
  const userData = (process && process.env && process.env.APPDATA) || os.homedir();
  const qpath = path.join(userData, quarantineDirName);
  try {
    await fs.mkdir(qpath, { recursive: true });
  } catch (e) {}
  return qpath;
}

function isIgnoredArchive(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ['.zip', '.rar', '.iso'].includes(ext);
}

function isTargetExe(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ext === '.exe';
}

async function quarantineFile(filePath) {
  try {
    const qdir = await ensureQuarantineDir();
    const base = path.basename(filePath);
    const dest = path.join(qdir, `${Date.now()}__${base}`);
    // try rename, fallback to copy+unlink
    try {
      await fs.rename(filePath, dest);
    } catch (err) {
      // fallback
      await fs.copyFile(filePath, dest);
      await fs.unlink(filePath);
    }
    // store metadata
    await db.addQuarantine({
      originalPath: filePath,
      quarantinedPath: dest,
      filename: base,
      time: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Quarantine error', err);
    return false;
  }
}

async function startWatching(paths = []) {
  const watcher = chokidar.watch(paths, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: 1
  });

  watcher.on('add', async (filePath) => {
    try {
      if (isIgnoredArchive(filePath)) return;
      if (isTargetExe(filePath)) {
        console.log('Quarantining', filePath);
        await quarantineFile(filePath);
      }
    } catch (e) {
      console.error('Watcher error', e);
    }
  });

  watcher.on('error', error => console.error('Watcher error', error));
  return watcher;
}

module.exports = { startWatching, quarantineFile };
