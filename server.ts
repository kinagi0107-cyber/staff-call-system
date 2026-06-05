import express, { Request, Response } from 'express';
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
  updateCallStatus,
  deleteAllCalls,
  closeDatabase,
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
    const { qrCodeId, locationName } = req.body;

    if (!qrCodeId || !locationName) {
      res.status(400).json({ error: 'qrCodeId and locationName are required' });
      return;
    }

    // Verify QR code exists
    const qrCode = await getQRCode(qrCodeId);
    if (!qrCode) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    const callId = uuidv4();
    await addStaffCall(callId, qrCodeId, locationName);

    // Broadcast to all connected clients
    const callData = {
      id: callId,
      qr_code_id: qrCodeId,
      location_name: locationName,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    broadcastToClients({
      type: 'new_call',
      data: callData,
    });

    res.json(callData);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
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

function broadcastToClients(message: any) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  activeConnections.forEach((res) => {
    res.write(data);
  });
}

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
