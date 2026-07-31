import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./staff_calls.db');

// Hardcoded QR codes that should always be available
const HARDCODED_QR_CODES = [
  { id: '4c9db894-dfd0-4423-99d7-4fbedef4ee39', name: 'UFO7 A' },
  { id: '5a28e9c5-717d-451a-9050-69e10ebc7c7f', name: 'UFO7 B' },
  { id: 'f36aeb0f-1be4-4ead-a703-02ad74f219a6', name: 'UFO8 A' },
  { id: 'b7ba383e-24a9-4b1b-9bc6-cfe410179692', name: 'UFO8 B' },
  { id: '7ef7d081-ae90-4393-be0d-d0817c0dc5e9', name: 'UFO8 C' },
  { id: 'e2a27569-1fd0-4687-aa10-5cba053b71fe', name: 'UFO9 A' },
  { id: '53ab979a-cff9-4bd9-b787-c9d4dd1f02da', name: 'UFO9 B' },
  { id: '9b3c1e34-c2b1-4d19-9f7e-ed9a0d4d78eb', name: 'UFO10 A' },
  { id: '35eca62f-cc04-463a-bfab-19e693362f98', name: 'UFO10 B' },
  { id: 'eb5296c0-a2f4-4622-8a6c-6de8b9f16411', name: 'クレナ2 A' },
  { id: '1f862b63-40e6-47ba-a7fa-622a3ae53c38', name: 'クレナ2 B' },
  { id: '8d22d5bb-7930-4b7d-bc0a-4dd7d6d2be4a', name: 'クレナ2 C' },
  { id: '0aaf863d-2620-4e49-8f78-522361428ba7', name: 'ワイフワーク バズ4 上' },
  { id: 'c24a70f5-e2cd-4d4d-9f2a-382f02928a11', name: 'ライフワーク バズW' },
  { id: '37afa29b-5a14-479f-bb6b-33d44741b492', name: 'バズミニ' },
  { id: '16f97168-7759-48fb-85f5-72cc05bb35a2', name: 'フラッシュボール' },
  { id: '542070e1-27f0-4d9a-9707-2d680eae2180', name: 'ポケットリフター' },
  { id: 'b615bc21-e7a7-4bad-a9ec-d7566f26f974', name: 'らくちゃれA 下' },
  { id: '2d826806-67c5-451d-b03a-9eb15e4abd35', name: 'クレナ2 D' },
  { id: 'd23ed6bb-01cd-4d79-8d78-7881344738fe', name: 'クレナ2 E' },
  { id: '68c1db1d-470c-481f-96a1-ef2452bfb168', name: 'クレナ2 F' },
  { id: '32b31bcc-f393-4fa8-8439-8d4f55aa4035', name: 'クレナ2 G' },
  { id: 'baeb8647-5014-4b20-8c10-bc2d10913a9a', name: 'クレナ2 H' },
  { id: '477a1109-9ecb-4b37-9803-7c65783f242d', name: 'クレナ2 I' },
  { id: '8f8c85ef-7195-4079-9b10-db8722ec753f', name: 'クレナ3 A' },
  { id: '9252ea2c-757b-48fe-b3dd-47337468d6eb', name: 'クレナ3 B' },
  { id: 'a7fffeb2-5676-44c4-9e28-d225a3192375', name: 'クレナ3 C' },
  { id: '27f34b35-c212-42d9-9d85-896faff56081', name: 'クレナ3 D' },
  { id: '664d4a70-2363-4287-af78-aea1a044a45d', name: 'ストライカー' },
  { id: 'f9639eda-434c-41f9-a35e-6eb964229bb9', name: 'らくちゃれA 上' },
  { id: '3d507785-4774-45db-95c6-b7afc83e1f04', name: 'らくちゃれB 下' },
  { id: 'fd150314-ae83-4a96-9a6c-eeb13ec81404', name: 'らくちゃれB 上' },
  { id: 'f88df97b-7bb4-4975-9f1a-25b93f0fddda', name: '両替機 A' },
  { id: 'f2c0dd6d-4c48-4163-a726-3043754f089a', name: '両替機 B' },
  { id: '06f4279b-bf9f-48d8-a2d6-54dfdc6f63c9', name: '両替機 C' },
  { id: '6cf23ee3-5ce3-4aa9-a77c-cbe2a91eff6d', name: 'トリプルセカンド A' },
  { id: '25eed72b-9f15-4254-8d34-520b381d6f98', name: 'トリプルセカンド B' },
  { id: '68cbc5e5-92df-4993-b433-490deb2b9614', name: 'トリプルセカンド C' },
  { id: 'ef080674-6b07-47ca-a122-e1ee14a5a79c', name: 'トリプルツイン A' },
  { id: '1a368c78-d568-43cd-9bd3-914ac574e4a6', name: 'トリプルツイン B' },
  { id: 'af04b3f8-b2cf-4f45-9358-ea473ffda97d', name: 'トリプルツイン C' },
  { id: '61b37013-2a53-4bf1-b67d-e3245ee534e5', name: 'トリプルツイン D' },
  { id: '3874648a-2195-4123-81dc-b9ac07472340', name: 'ライフワーク バズ4 下' },
  { id: '735d371f-4e2c-4a57-b2ad-e0170fa2157a', name: 'ZIPPO ショーケース' },
  { id: '7fda0224-c657-428a-b002-85271811a4e4', name: 'アメカジ ショーケース' },
  { id: '16859ce5-115f-46ea-9e4e-c04ed4634f0b', name: 'アメカジアクセサリー ショーケース' },
  { id: 'eaf8d889-47f7-4cc0-a0bf-9df04634e87f', name: 'サングラス&アクセサリー ショーケース' },
  { id: '5bfc23e2-13c2-4fe0-8f06-b487ff767b03', name: 'ブランド ショーケース' },
  { id: 'bd4cdf0e-8cfc-4a92-8b3c-995f3e1e8826', name: '香水 ショーケース' },
  { id: '54963fa2-4c40-4386-874c-efa3f27bb9f2', name: '時計&ZIPPO ショーケース' },
  { id: 'd8d94c41-9898-445b-8a90-76f8dc6990b3', name: 'ストリート ショーケース' },
  { id: 'db1c37d8-8d73-4177-a642-c1c9e4ab7f7b', name: 'レディース' },
  { id: '6493aea2-a28b-4e02-8298-c1192f1ae48b', name: 'スニーカー' },
  { id: 'c777e32f-214c-4c62-a46e-8dcdd3300358', name: 'クレナ2 J' },
];

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

export async function seedHardcodedQRCodes() {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      HARDCODED_QR_CODES.forEach((code) => {
        db.run(
          'INSERT OR IGNORE INTO qr_codes (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [code.id, code.name],
          (err) => {
            if (err) console.error(`Error seeding QR code ${code.id}:`, err);
          }
        );
      });
      resolve();
    });
  });
}

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
            department TEXT DEFAULT 'none',
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
            request TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
          )
        `);

        // Staff status table
        db.run(`
          CREATE TABLE IF NOT EXISTS staff_status (
            id INTEGER PRIMARY KEY,
            treasure TEXT DEFAULT 'available',
            vintage TEXT DEFAULT 'available'
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
// db.tsのinitializeDatabase()内、CREATE TABLE群の後に追加
db.run(`ALTER TABLE qr_codes ADD COLUMN department TEXT DEFAULT 'none'`, () => {});
db.run(`ALTER TABLE staff_calls ADD COLUMN request TEXT DEFAULT ''`, () => {});

    // Seed hardcoded QR codes
    await seedHardcodedQRCodes();

    console.log('Database initialized successfully');
    console.log(`Seeded ${HARDCODED_QR_CODES.length} hardcoded QR codes`);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function addQRCode(id: string, name: string, department: string = 'none') {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO qr_codes (id, name, department) VALUES (?, ?, ?)',
      [id, name, department],
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
        else {
          // If not found in database, check hardcoded list
          if (!row) {
            const hardcoded = HARDCODED_QR_CODES.find((code) => code.id === id);
            resolve(hardcoded || null);
          } else {
            resolve(row);
          }
        }
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

export async function addStaffCall(id: string, qrCodeId: string, locationName: string, request: string = '') {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO staff_calls (id, qr_code_id, location_name, status, request) VALUES (?, ?, ?, ?, ?)',
      [id, qrCodeId, locationName, 'pending', request],
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
            `SELECT 
        id, 
        qr_code_id, 
        location_name, 
        status,
        request,
        datetime(created_at, '+9 hours') as created_at,
        datetime(resolved_at, '+9 hours') as resolved_at
      FROM staff_calls 
      ORDER BY created_at DESC 
      LIMIT 50`,
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

export { db, HARDCODED_QR_CODES };

export async function getRecentCallByQRCode(qrCodeId: string, seconds: number) {
  return new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT id FROM staff_calls 
       WHERE qr_code_id = ? 
       AND created_at >= datetime('now', '-' || ? || ' seconds')
       ORDER BY created_at DESC 
       LIMIT 1`,
      [qrCodeId, seconds],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}
// スタッフステータスをDBに保存
export async function saveStaffStatusToDB(treasure: string, vintage: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO staff_status (id, treasure, vintage) VALUES (1, ?, ?)`,
      [treasure, vintage],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// スタッフステータスをDBから読み込み
export async function loadStaffStatusFromDB() {
  return new Promise<{ treasure: string; vintage: string } | null>((resolve, reject) => {
    db.get(
      `SELECT treasure, vintage FROM staff_status WHERE id = 1`,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}
