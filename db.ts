import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./staff_calls.db');

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

export async function initializeDatabase() {
  try {
    // Create tables
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        // QR Codes table
        db.run(`
          CREATE TABLE IF NOT EXISTS qr_codes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Staff calls table
        db.run(`
          CREATE TABLE IF NOT EXISTS staff_calls (
            id TEXT PRIMARY KEY,
            qr_code_id TEXT NOT NULL,
            location_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function addQRCode(id: string, name: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO qr_codes (id, name) VALUES (?, ?)',
      [id, name],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function getQRCode(id: string) {
  return new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM qr_codes WHERE id = ?',
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export async function getAllQRCodes() {
  return new Promise<any[]>((resolve, reject) => {
    db.all(
      'SELECT * FROM qr_codes ORDER BY created_at DESC',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

export async function addStaffCall(id: string, qrCodeId: string, locationName: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO staff_calls (id, qr_code_id, location_name, status) VALUES (?, ?, ?, ?)',
      [id, qrCodeId, locationName, 'pending'],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function getStaffCalls() {
  return new Promise<any[]>((resolve, reject) => {
    db.all(
      'SELECT * FROM staff_calls ORDER BY created_at DESC LIMIT 50',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

export async function updateCallStatus(id: string, status: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'UPDATE staff_calls SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function deleteAllCalls() {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'DELETE FROM staff_calls',
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function closeDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export { db };
