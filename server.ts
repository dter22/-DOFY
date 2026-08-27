import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Local JSON Storage Path for Server Persistence
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'activation_requests.json');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');
const PASSCODE_FILE = path.join(DATA_DIR, 'passcode.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

// ======================== API ROUTES ========================

// 1. Users API
app.get('/api/users', (req, res) => {
  const users = readJsonFile(USERS_FILE, []);
  res.json({ success: true, users });
});

app.post('/api/users', (req, res) => {
  const { users } = req.body;
  if (Array.isArray(users)) {
    writeJsonFile(USERS_FILE, users);
    return res.json({ success: true, count: users.length });
  }
  const user = req.body;
  const currentUsers = readJsonFile<any[]>(USERS_FILE, []);
  const existingIdx = currentUsers.findIndex(
    (u) => (user.id && u.id === user.id) || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase())
  );
  if (existingIdx >= 0) {
    currentUsers[existingIdx] = { ...currentUsers[existingIdx], ...user };
  } else {
    currentUsers.push(user);
  }
  writeJsonFile(USERS_FILE, currentUsers);
  res.json({ success: true, user });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const currentUsers = readJsonFile<any[]>(USERS_FILE, []);
  const idx = currentUsers.findIndex((u) => u.id === id);
  if (idx >= 0) {
    currentUsers[idx] = { ...currentUsers[idx], ...update };
    writeJsonFile(USERS_FILE, currentUsers);
    return res.json({ success: true, user: currentUsers[idx] });
  }
  res.status(404).json({ success: false, message: 'User not found' });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  let currentUsers = readJsonFile<any[]>(USERS_FILE, []);
  currentUsers = currentUsers.filter((u) => u.id !== id);
  writeJsonFile(USERS_FILE, currentUsers);
  res.json({ success: true });
});

// 2. Activation Requests API
app.get('/api/activation-requests', (req, res) => {
  const requests = readJsonFile(REQUESTS_FILE, []);
  res.json({ success: true, requests });
});

app.post('/api/activation-requests', (req, res) => {
  const newReq = req.body;
  if (!newReq.id) {
    newReq.id = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  if (!newReq.submittedAt) {
    newReq.submittedAt = new Date().toISOString();
  }
  const requests = readJsonFile<any[]>(REQUESTS_FILE, []);
  // check if duplicate user code or existing request
  const idx = requests.findIndex((r) => r.id === newReq.id || (r.userCode && r.userCode === newReq.userCode && r.status === 'pending'));
  if (idx >= 0) {
    requests[idx] = { ...requests[idx], ...newReq };
  } else {
    requests.unshift(newReq);
  }
  writeJsonFile(REQUESTS_FILE, requests);
  res.json({ success: true, request: newReq });
});

app.put('/api/activation-requests/:id', (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const requests = readJsonFile<any[]>(REQUESTS_FILE, []);
  const idx = requests.findIndex((r) => r.id === id);
  if (idx >= 0) {
    requests[idx] = { ...requests[idx], ...update };
    writeJsonFile(REQUESTS_FILE, requests);
    return res.json({ success: true, request: requests[idx] });
  }
  res.status(404).json({ success: false, message: 'Request not found' });
});

app.delete('/api/activation-requests/:id', (req, res) => {
  const { id } = req.params;
  let requests = readJsonFile<any[]>(REQUESTS_FILE, []);
  requests = requests.filter((r) => r.id !== id);
  writeJsonFile(REQUESTS_FILE, requests);
  res.json({ success: true });
});

// 3. Custom Roles API
app.get('/api/custom-roles', (req, res) => {
  const roles = readJsonFile(ROLES_FILE, []);
  res.json({ success: true, roles });
});

app.post('/api/custom-roles', (req, res) => {
  const { roles } = req.body;
  if (Array.isArray(roles)) {
    writeJsonFile(ROLES_FILE, roles);
    return res.json({ success: true, count: roles.length });
  }
  res.status(400).json({ success: false, message: 'Expected array of roles' });
});

// 4. Passcode API
app.get('/api/master-passcode', (req, res) => {
  const data = readJsonFile(PASSCODE_FILE, { passcode: 'DOFY-STAFF-2026' });
  res.json({ success: true, passcode: data.passcode });
});

app.post('/api/master-passcode', (req, res) => {
  const { passcode } = req.body;
  if (passcode) {
    writeJsonFile(PASSCODE_FILE, { passcode });
    return res.json({ success: true, passcode });
  }
  res.status(400).json({ success: false, message: 'Passcode required' });
});

// 5. Staff Directory API
app.get('/api/staff', (req, res) => {
  const staff = readJsonFile(STAFF_FILE, []);
  res.json({ success: true, staff });
});

app.post('/api/staff', (req, res) => {
  const { staff } = req.body;
  if (Array.isArray(staff)) {
    writeJsonFile(STAFF_FILE, staff);
    return res.json({ success: true, count: staff.length });
  }
  res.status(400).json({ success: false, message: 'Expected array of staff' });
});

// ======================== SERVER & VITE INTEGRATION ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
