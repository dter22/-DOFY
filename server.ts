import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for external domains like Netlify (majann.netlify.app)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const DEPT_SETTINGS_FILE = path.join(DATA_DIR, 'dept_settings.json');
const DEPT_APPLICATIONS_FILE = path.join(DATA_DIR, 'dept_applications.json');
const RESPONSIBILITIES_FILE = path.join(DATA_DIR, 'responsibilities.json');
const SITE_SETTINGS_FILE = path.join(DATA_DIR, 'site_settings.json');

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

// 6. Rules & Categories API
app.get('/api/categories', (req, res) => {
  const categories = readJsonFile(CATEGORIES_FILE, []);
  res.json({ success: true, categories });
});

app.post('/api/categories', (req, res) => {
  const { categories } = req.body;
  if (Array.isArray(categories)) {
    writeJsonFile(CATEGORIES_FILE, categories);
    return res.json({ success: true, count: categories.length });
  }
  res.status(400).json({ success: false, message: 'Expected array of categories' });
});

// 7. Department Settings API
app.get('/api/department-settings', (req, res) => {
  const settings = readJsonFile(DEPT_SETTINGS_FILE, {});
  res.json({ success: true, settings });
});

app.post('/api/department-settings', (req, res) => {
  const { settings } = req.body;
  if (settings && typeof settings === 'object') {
    writeJsonFile(DEPT_SETTINGS_FILE, settings);
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: 'Expected settings object' });
});

// 8. Department Applications API
app.get('/api/department-applications', (req, res) => {
  const applications = readJsonFile(DEPT_APPLICATIONS_FILE, []);
  res.json({ success: true, applications });
});

app.post('/api/department-applications', (req, res) => {
  const { applications } = req.body;
  if (Array.isArray(applications)) {
    writeJsonFile(DEPT_APPLICATIONS_FILE, applications);
    return res.json({ success: true, count: applications.length });
  }
  res.status(400).json({ success: false, message: 'Expected array of applications' });
});

// 9. Responsibilities API
app.get('/api/responsibilities', (req, res) => {
  const responsibilities = readJsonFile(RESPONSIBILITIES_FILE, []);
  res.json({ success: true, responsibilities });
});

app.post('/api/responsibilities', (req, res) => {
  const { responsibilities } = req.body;
  if (Array.isArray(responsibilities)) {
    writeJsonFile(RESPONSIBILITIES_FILE, responsibilities);
    return res.json({ success: true, count: responsibilities.length });
  }
  res.status(400).json({ success: false, message: 'Expected array of responsibilities' });
});

// 10. Site Settings API (Custom Site Name, etc.)
app.get('/api/site-settings', (req, res) => {
  const siteSettings = readJsonFile(SITE_SETTINGS_FILE, {
    siteTitle: 'Majan Management',
    siteSubtitle: 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي',
    serverName: 'سيرفر Majan State',
  });
  res.json({ success: true, siteSettings });
});

app.post('/api/site-settings', (req, res) => {
  const { siteSettings } = req.body;
  if (siteSettings && typeof siteSettings === 'object') {
    writeJsonFile(SITE_SETTINGS_FILE, siteSettings);
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: 'Expected siteSettings object' });
});

// 11. Comprehensive State Endpoint for Remote Syncing (Netlify, External Clients)
app.get('/api/state-bundle', (req, res) => {
  const users = readJsonFile(USERS_FILE, []);
  const staff = readJsonFile(STAFF_FILE, []);
  const categories = readJsonFile(CATEGORIES_FILE, []);
  const roles = readJsonFile(ROLES_FILE, []);
  const requests = readJsonFile(REQUESTS_FILE, []);
  const deptSettings = readJsonFile(DEPT_SETTINGS_FILE, {});
  const deptApplications = readJsonFile(DEPT_APPLICATIONS_FILE, []);
  const responsibilities = readJsonFile(RESPONSIBILITIES_FILE, []);
  const siteSettings = readJsonFile(SITE_SETTINGS_FILE, {
    siteTitle: 'Majan Management',
    siteSubtitle: 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي',
    serverName: 'سيرفر Majan State',
  });
  res.json({
    success: true,
    users,
    staff,
    categories,
    roles,
    requests,
    deptSettings,
    deptApplications,
    responsibilities,
    siteSettings,
    timestamp: new Date().toISOString(),
  });
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
