const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');

let db;
function getDbPath() {
  const base = (process && process.env && process.env.APPDATA) || os.homedir();
  return path.join(base, 'blaze_fire_wall.sqlite');
}

function init() {
  const p = getDbPath();
  db = new Database(p);
  db.prepare(`CREATE TABLE IF NOT EXISTS quarantine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    originalPath TEXT,
    quarantinedPath TEXT,
    time TEXT
  )`).run();
}

function addQuarantine({ filename, originalPath, quarantinedPath, time }) {
  const stmt = db.prepare('INSERT INTO quarantine (filename, originalPath, quarantinedPath, time) VALUES (?, ?, ?, ?)');
  return stmt.run(filename, originalPath, quarantinedPath, time);
}

function listQuarantine() {
  return db.prepare('SELECT id, filename, originalPath, quarantinedPath, time FROM quarantine ORDER BY time DESC').all();
}

function restore(id) {
  const row = db.prepare('SELECT * FROM quarantine WHERE id = ?').get(id);
  if (!row) throw new Error('Not found');
  // try move back
  const fs = require('fs').promises;
  return fs.rename(row.quarantinedPath, row.originalPath)
    .then(() => {
      db.prepare('DELETE FROM quarantine WHERE id = ?').run(id);
      return true;
    })
    .catch(async (err) => {
      // fallback copy
      try {
        await fs.copyFile(row.quarantinedPath, row.originalPath);
        await fs.unlink(row.quarantinedPath);
        db.prepare('DELETE FROM quarantine WHERE id = ?').run(id);
        return true;
      } catch (e) {
        throw e;
      }
    });
}

function remove(id) {
  const row = db.prepare('SELECT * FROM quarantine WHERE id = ?').get(id);
  if (!row) throw new Error('Not found');
  const fs = require('fs').promises;
  return fs.unlink(row.quarantinedPath)
    .then(() => {
      db.prepare('DELETE FROM quarantine WHERE id = ?').run(id);
      return true;
    });
}

module.exports = { init, addQuarantine, listQuarantine, restore, delete: remove };
