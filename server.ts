import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// SSE接続を管理するセット
const sseClients = new Set<any>();

// 日本標準時刻（JST）にフォーマット
function formatDateToJST(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo'
  };
  const formatter = new Intl.DateTimeFormat('ja-JP', options);
  return formatter.format(date);
}
// Google Sheets認証設定
const sheetsAPI = google.sheets('v4');
const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '15UOQmvWzvToBQ64Szzj0I0Kj2gkcFAVwM3u1aa4_tEw';

// Google認証（サービスアカウント）
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
} );import {
  initializeDatabase,
  addQRCode,
  getQRCode,
  getAllQRCodes,
  addStaffCall,
  getStaffCalls,
  updateCallStatus,
  deleteAllCalls,
  closeDatabase,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Sheets認証情報
const SPREADSHEET_ID = '15UOQmvWzvToBQ64Szzj0I0Kj2gkcFAVwM3u1aa4_tEw';
const SHEET_NAME = 'ログ';

// サービスアカウント認証情報（JSONキーの内容）
const serviceAccountKey = {
  type: 'service_account',
  project_id: 'sharp-doodad-502408-b1',
  private_key_id: '4653a315e7e6eed7e291ab4c6b675be4f19ad295',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDdYAyeDN/PnXK+\nUx+RlnDTsZahm1yq6Xh1WKKmkDMmKHmsflg0nRxSGkoSRSW/6lL/E7Cb0ZkeK7za\nzUBrhSy1cE1KOxVvJoMW2rjp9m+1IwB5hPQHht8SjcUqFoXJMJSWwyYYVKTswGCe\nuibrfoMwZqmtiBErfPDuXWDpBYIsUMYXiIpvJ5voeGyXluTPpyYXUupGFuvFX/y+\nu5S0/jApIJLotSNWmr544AZu6ydbgnmUqguOM/6oa4gRFx9cJAwk8sYJAVHQIwFc\nTIZHTiDzV1tQQ2IDTmAK4FSourVIN+MuqpKBHfM7LFVYfpfGce1f4rs+LQvRJRVI\noNmk5MttAgMBAAECggEAPn+8ADElTOGoP/iKzJkbEIEuREDvGCejBQo5nWnPrwG1\nXFAtSeljUgCvEdpoznZy6SXfchZqMrzpbCKPgeuO1Ei44XCt2/wU/XJRy2fyYMLZ\ngvVYyfk3aG8TD49dRRBMmwXMbwkSqO6lOJrYmxrUIemSFPZ51nvHL5y4XAFcn3LF\n9nRIv1wXfbr/FeOnBqf6qqT7AoyuDF7qE++n/huxRjJvwzQgKgYTWZ/MHXgw8tHh\nzT/YFh/Psl8qReaAPuEguj2hzg8urz+80rZEe0BxWnA3UASeXY9IFZ+nbGltAgwT\nVgbf4ZD9wd485Sp03/L721jlgNanG09UncVRrWpf1wKBgQD4myucxi3tc6Imt2ft\nlGFKGHIFyLYEj+Z8M/Mf+mV3NPLYV+Qlx54yCKAY6fip61TcJv80gHLRU1EeEzF8\nWxHi60pkfPX5KyJK8Mvt41vNrs5Us50S2tYKHhYrjnUSdMj6J6Pt+jwbx8yqTf4q\nTEXQvCHQgdpKUFehPRNKTRm/MwKBgQDj9YyAI7PcPfh8JFfTFK8uYxjnwvT8+N+j\n0261v1Nu/sRjoeJ0CnEJDKK4YOvJoDSGOwaTJbE2fUOUuSf4pMCP2vdgeqHGQs2W\nchnP5mn03dY6IHyTGqOT9beulY87DLL8HqJVS8ibc/RzFvaH6YMmU8Hmv2SHaAtA\nr0LTXwPK3wKBgC8gAuFh87zKKZebNpkjglmwTpToGhC9UlyC4HhUV72EDPCToIzE\nzSkA15BBccCL+ncM8V17Z8hkOcEwtDW1cauJHH317g6Abay0/oMmkPVpSHVn4sN7\nNg2O7HbvNyP7fUlmED4BLDm74wD5bc+Iy8cokmRa6Q0jM6k90ZVJDjNfAoGBAJGu\nzHLb3kdDh3j21PW+A1KW3ETJMD43Yt1U8yzNsCmAQcwWmh1kyuZon9lLf4SkkMy0\nDjid3woetcDnL6dUywdkfbG3zYliCfc6xko6S77EwvL07ggo/x9A6nl1dUrci8pa\nXY47V2IZkcC3jShA0KL+5i1sZXevw3k8SG3DDC5rAoGAGoiwln6TD5h04WlSV7I/\nry0+vRJ6RBk99pD4Iqg8z7pW2pLM3DMUqG2lnTptM0U2EjYGYrv0/YxBseJMXl4b\nFfU/k/Yhh4h8S54dKQZTqTgmrXuKHOVrIGob+ojmvkLIi9g58JrSJrBKiFP8pnMW\nIjenRuPK7+uFKIjpFG7UP4o=\n-----END PRIVATE KEY-----\n',
  client_email: 'staff-call-system@sharp-doodad-502408-b1.iam.gserviceaccount.com',
  client_id: '111454910399201950100',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/staff-call-system%40sharp-doodad-502408-b1.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Google Sheets APIクライアント
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  } )
});
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store for active connections (for real-time updates)
const activeConnections = new Set<Response>();
// スタッフ状態管理
let staffStatus = {
  treasure: 'available',
  vintage: 'available'
};

// Initialize database on startup
await initializeDatabase();

// API Routes

// Get all QR codes
app.get('/api/qr-codes', async (req: Request, res: Response) => {
  try {
    const codes = await getAllQRCodes();
    res.json(codes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// Create new QR code
app.post('/api/qr-codes', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const id = uuidv4();
    await addQRCode(id, name);

    res.json({ id, name });
  } catch (error) {
    console.error('Error creating QR code:', error);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// Get specific QR code
app.get('/api/qr-codes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const code = await getQRCode(id);

    if (!code) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    res.json(code);
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// Create staff call
app.post('/api/calls', async (req: Request, res: Response) => {
  try {
    const { qrCodeId, location, locationName } = req.body;
    const finalLocation = location || locationName;

    if (!qrCodeId || !finalLocation) {
      res.status(400).json({ error: 'qrCodeId and location are required' });
      return;
    }

    // Verify QR code exists
    const qrCode = await getQRCode(qrCodeId);
    if (!qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    const callId = uuidv4();
    await addStaffCall(callId, qrCodeId, finalLocation);

    // Broadcast to all connected clients
    const callData = {
      id: callId,
      qr_code_id: qrCodeId,
      location_name: finalLocation,
      status: 'pending',
            created_at: formatDateToJST(new Date()),
    };

    broadcastToClients({
      type: 'new-call',
      call: callData,
    });

    // Google Sheetsにログを記録
    await logCallToSheet(finalLocation);

    res.json(callData);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});
app.post('/api/staff-status', async (req: Request, res: Response) => {
  try {
    const { treasure, vintage } = req.body;

    if (treasure === undefined || vintage === undefined) {
      res.status(400).json({ error: 'treasure and vintage status are required' });
      return;
    }

    broadcastToClients({
      type: 'staff-status-updated',
      data: { treasure, vintage },
    });

    res.json({ treasure, vintage });
  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({ error: 'Failed to update staff status' });
  }
});

// Get all staff calls
app.get('/api/calls', async (req: Request, res: Response) => {
  try {
    const calls = await getStaffCalls();
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Update call status
app.patch('/api/calls/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    await updateCallStatus(id, status);

    // Broadcast update to all connected clients
    broadcastToClients({
      type: 'call_updated',
      data: { id, status },
    });

    res.json({ id, status });
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Delete all calls
app.delete('/api/calls', async (req: Request, res: Response) => {
  try {
    await deleteAllCalls();

    // Broadcast to all connected clients
    broadcastToClients({
      type: 'calls_cleared',
    });

    res.json({ message: 'All calls deleted' });
  } catch (error) {
    console.error('Error deleting calls:', error);
    res.status(500).json({ error: 'Failed to delete calls' });
  }
});

// Server-Sent Events for real-time updates
// SSE endpoint for real-time updates
app.get('/api/updates', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  activeConnections.add(res);

  res.write('data: {"type":"connected"}\n\n');

  req.on('close', () => {
    activeConnections.delete(res);
  });
});

// Legacy endpoint for backward compatibility
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  activeConnections.add(res);

  res.write('data: {"type":"connected"}\n\n');

  req.on('close', () => {
    activeConnections.delete(res);
  });
});

// スタッフ状態を取得
app.get('/api/staff-status', (req: Request, res: Response) => {
  res.json(staffStatus);
});

// スタッフ状態を更新
app.post('/api/staff-status', (req: Request, res: Response) => {
  const { treasure, vintage } = req.body;
  
  if (treasure) staffStatus.treasure = treasure;
  if (vintage) staffStatus.vintage = vintage;
  
  // すべてのSSEクライアントにブロードキャスト
  broadcastToClients({ type: 'staff_status_updated', data: staffStatus });
  
  res.json(staffStatus);
});

// Google Sheetsにログを記録
async function logCallToSheet(locationName: string) {
  try {
    const now = new Date();
    const timestamp = formatDateToJST(now);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, locationName]]
      }
    });
    
    console.log(`Logged to Google Sheets: ${timestamp} - ${locationName}`);
  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
  }
}
function broadcastToClients(message: any) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  activeConnections.forEach((res) => {
    res.write(data);
  });
}
// Google Sheetsにログを記録
async function logCallToSheet(location: string) {
  try {
    const authClient = await auth.getClient();
    
    const timestamp = formatDateToJST(new Date());
    
    // シートに追加するデータ
    const values = [
      [timestamp, location]
    ];

    await sheetsAPI.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values,
      },
    });

    console.log(`Call logged to Google Sheets: ${location} at ${timestamp}`);
  } catch (error) {
    console.error('Error logging call to Google Sheets:', error);
  }
}

//

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the app`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});
