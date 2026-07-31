import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  initializeDatabase,
  addQRCode,
  getQRCode,
  getAllQRCodes,
  addStaffCall,
  getStaffCalls,
  getRecentCallByQRCode,
  updateCallStatus,
  deleteAllCalls,
  closeDatabase,
  saveStaffStatusToDB,
  loadStaffStatusFromDB,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
} );

// Initialize database on startup
await initializeDatabase();
// DBからスタッフステータスを復元
const savedStatus = await loadStaffStatusFromDB();
if (savedStatus) {
  staffStatus.treasure = savedStatus.treasure;
  staffStatus.vintage = savedStatus.vintage;
  console.log('Staff status restored from DB:', staffStatus);
}

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
    const { name, department } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const id = uuidv4();
    await addQRCode(id, name, department || 'none');

    res.json({ id, name, department: department || 'none' });
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

app.post('/api/calls', async (req: Request, res: Response) => {
  try {
    const { qrCodeId, location, locationName, request } = req.body;
    const finalLocation = location || locationName;
    const finalRequest = request || '';

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

    // 30秒以内の重複呼び出しチェック
    const recentCall = await getRecentCallByQRCode(qrCodeId, 30);
    if (recentCall) {
      res.status(429).json({ error: 'Duplicate call within 30 seconds' });
      return;
    }

    const callId = uuidv4();
    await addStaffCall(callId, qrCodeId, finalLocation, finalRequest);

    const callData = {
      id: callId,
      qr_code_id: qrCodeId,
      location_name: finalLocation,
      status: 'pending',
      request: finalRequest,
      created_at: formatDateToJST(new Date()),
    };

    broadcastToClients({
      type: 'new-call',
      call: callData,
    });

    await logCallToSheet(finalLocation, finalRequest);

    res.json(callData);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Update staff status
app.post('/api/staff-status', async (req: Request, res: Response) => {
  try {
    const { treasure, vintage } = req.body;

    if (treasure === undefined || vintage === undefined) {
      res.status(400).json({ error: 'treasure and vintage status are required' });
      return;
    }

    staffStatus.treasure = treasure;
    staffStatus.vintage = vintage;
 // DBに永続化
    await saveStaffStatusToDB(treasure, vintage);
    
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

// SSE endpoint for real-time updates
app.get('/api/updates', (req: Request, res: Response) => {
  console.log('Client connected to SSE');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  activeConnections.add(res);
  console.log(`Total SSE connections: ${activeConnections.size}`);

  res.write('data: {"type":"connected"}\n\n');

  req.on('close', () => {
    activeConnections.delete(res);
    console.log(`Client disconnected. Total connections: ${activeConnections.size}`);
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

// Get staff status
app.get('/api/staff-status', (req: Request, res: Response) => {
  res.json(staffStatus);
});

// Broadcast to all connected clients
function broadcastToClients(message: any) {
  console.log(`Broadcasting to ${activeConnections.size} clients:`, message);
  
  const data = `data: ${JSON.stringify(message)}\n\n`;
  const disconnectedClients: Response[] = [];

  activeConnections.forEach((res) => {
    try {
      res.write(data);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      disconnectedClients.push(res);
    }
  });

  disconnectedClients.forEach((res) => {
    activeConnections.delete(res);
  });
}

// Log call to Google Sheets
async function logCallToSheet(location: string, request: string = '') {
  try {
    const authClient = await auth.getClient();
    
    const timestamp = formatDateToJST(new Date());
    
    // シートに追加するデータ
    const values = [
      [timestamp, location, request]
    ];

    await sheetsAPI.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: spreadsheetId,
      range: 'ログ!A:C',
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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the app` );
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
