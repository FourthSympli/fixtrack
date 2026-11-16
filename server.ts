import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import express, {NextFunction, Request, Response} from 'express';
import {createServer as createViteServer} from 'vite';
import type {
  Customer,
  Device,
  DeviceType,
  PaymentStatus,
  RepairRequest,
  RepairStatus,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET || 'fixtrack-local-dev-secret-change-in-production';
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'fixtrack-store.json');

interface StoredUser {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface StoreState {
  nextIds: {
    user: number;
    customer: number;
    device: number;
    repair: number;
    ticketNum: number;
  };
  users: StoredUser[];
  customers: Customer[];
  devices: Device[];
  repairs: RepairRequest[];
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, 'hex');
  if (hashBuffer.length !== originalBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, originalBuffer);
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLength), 'base64').toString('utf8');
}

function signJwt(payload: {sub: number; email: string; fullName: string}): string {
  const header = base64UrlEncode(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    }),
  );
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest();
  return `${header}.${body}.${base64UrlEncode(signature)}`;
}

function verifyJwt(
  token: string,
): {sub: number; email: string; fullName: string} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = base64UrlEncode(
      crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest(),
    );
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const decoded = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (typeof decoded.exp === 'number' && decoded.exp < now) return null;
    return decoded;
  } catch {
    return null;
  }
}

function computePaymentStatus(
  finalCost: number,
  amountPaid: number,
): PaymentStatus {
  if (amountPaid <= 0) return 'Unpaid';
  if (amountPaid + 0.001 >= finalCost && finalCost >= 0) return 'Paid';
  return 'Partial';
}

function createInitialSeed(): StoreState {
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  return {
    nextIds: {
      user: 2,
      customer: 6,
      device: 8,
      repair: 8,
      ticketNum: 1008,
    },
    users: [
      {
        id: 1,
        fullName: 'Alex Rivera',
        email: 'tech@fixtrack.local',
        passwordHash: hashPassword('fixtrack123'),
        createdAt: daysAgo(30),
      },
    ],
    customers: [
      {
        id: 1,
        name: 'Maya Lin',
        phone: '(415) 555-0142',
        email: 'maya.lin@example.com',
        address: '412 Maple Street, Apt 4B',
        notes: 'Prefers SMS text updates when ready for pickup.',
        createdAt: daysAgo(18),
      },
      {
        id: 2,
        name: 'Jordan Brooks',
        phone: '(415) 555-0198',
        email: 'j.brooks@example.com',
        address: '890 Oakridge Ave',
        notes: 'University student — rush repairs when possible.',
        createdAt: daysAgo(14),
      },
      {
        id: 3,
        name: 'Elena Vance',
        phone: '(415) 555-0231',
        email: 'elena.vance@example.com',
        address: '125 Pinecrest Blvd',
        notes: 'Drops off multiple family devices.',
        createdAt: daysAgo(10),
      },
      {
        id: 4,
        name: 'Marcus Chen',
        phone: '(415) 555-0277',
        email: 'mchen@example.com',
        address: '77 Cedar Lane',
        notes: '',
        createdAt: daysAgo(5),
      },
      {
        id: 5,
        name: 'Priya Patel',
        phone: '(415) 555-0319',
        email: 'priya.patel@example.com',
        address: '305 Elmwood Court',
        notes: 'Needs itemized receipt for work reimbursement.',
        createdAt: daysAgo(2),
      },
    ],
    devices: [
      {
        id: 1,
        customerId: 1,
        deviceType: 'Phone',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'F2LZN849Q1',
        createdAt: daysAgo(18),
      },
      {
        id: 2,
        customerId: 1,
        deviceType: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Air M2',
        serialNumber: 'C02YM412J1',
        createdAt: daysAgo(7),
      },
      {
        id: 3,
        customerId: 2,
        deviceType: 'Laptop',
        brand: 'Dell',
        model: 'XPS 15 9520',
        serialNumber: 'DXPS9520-881',
        createdAt: daysAgo(14),
      },
      {
        id: 4,
        customerId: 3,
        deviceType: 'Phone',
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        serialNumber: 'R58T9120XK',
        createdAt: daysAgo(10),
      },
      {
        id: 5,
        customerId: 3,
        deviceType: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon',
        serialNumber: 'PF3K9201',
        createdAt: daysAgo(4),
      },
      {
        id: 6,
        customerId: 4,
        deviceType: 'Phone',
        brand: 'Google',
        model: 'Pixel 8',
        serialNumber: 'GP8-441029',
        createdAt: daysAgo(5),
      },
      {
        id: 7,
        customerId: 5,
        deviceType: 'Laptop',
        brand: 'HP',
        model: 'Spectre x360 14',
        serialNumber: '5CD21988KP',
        createdAt: daysAgo(2),
      },
    ],
    repairs: [
      {
        id: 1,
        ticketCode: 'FT-1001',
        customerId: 1,
        deviceId: 1,
        issueDescription: 'Cracked OLED display after drop; Face ID still functional.',
        diagnosisNotes: 'Replaced OEM-grade OLED assembly and transferred True Tone serial.',
        status: 'Collected',
        estimatedCost: 229,
        finalCost: 229,
        amountPaid: 229,
        paymentStatus: 'Paid',
        createdAt: daysAgo(18),
        updatedAt: daysAgo(16),
        completedAt: daysAgo(16),
      },
      {
        id: 2,
        ticketCode: 'FT-1002',
        customerId: 2,
        deviceId: 3,
        issueDescription: 'Laptop hinge loose on right side and keyboard keys sticking.',
        diagnosisNotes: 'Rebuilt brass hinge standoffs and replaced keyboard deck.',
        status: 'Collected',
        estimatedCost: 185,
        finalCost: 195,
        amountPaid: 195,
        paymentStatus: 'Paid',
        createdAt: daysAgo(14),
        updatedAt: daysAgo(11),
        completedAt: daysAgo(11),
      },
      {
        id: 3,
        ticketCode: 'FT-1003',
        customerId: 3,
        deviceId: 4,
        issueDescription: 'USB-C charging port intermittent; fast charging fails.',
        diagnosisNotes: 'Sub-board USB-C daughterboard replaced; tested at 45W.',
        status: 'Ready',
        estimatedCost: 95,
        finalCost: 95,
        amountPaid: 45,
        paymentStatus: 'Partial',
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1),
        completedAt: daysAgo(1),
      },
      {
        id: 4,
        ticketCode: 'FT-1004',
        customerId: 1,
        deviceId: 2,
        issueDescription: 'Battery service warning; shuts off unexpectedly around 20%.',
        diagnosisNotes: 'Battery cycle count at 712. New battery cell installed, calibrating.',
        status: 'Ready',
        estimatedCost: 169,
        finalCost: 169,
        amountPaid: 0,
        paymentStatus: 'Unpaid',
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
        completedAt: daysAgo(1),
      },
      {
        id: 5,
        ticketCode: 'FT-1005',
        customerId: 4,
        deviceId: 6,
        issueDescription: 'Back glass shattered near camera bar; microphone muffled.',
        diagnosisNotes: 'Waiting for replacement rear housing adhesive seal to cure.',
        status: 'In Progress',
        estimatedCost: 110,
        finalCost: 110,
        amountPaid: 50,
        paymentStatus: 'Partial',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
        completedAt: null,
      },
      {
        id: 6,
        ticketCode: 'FT-1006',
        customerId: 3,
        deviceId: 5,
        issueDescription: 'Cooling fan rattling loudly under load and thermal throttling.',
        diagnosisNotes: 'Dust buildup cleared; replacement fan ordered from supplier.',
        status: 'In Progress',
        estimatedCost: 135,
        finalCost: 135,
        amountPaid: 0,
        paymentStatus: 'Unpaid',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(0),
        completedAt: null,
      },
      {
        id: 7,
        ticketCode: 'FT-1007',
        customerId: 5,
        deviceId: 7,
        issueDescription: 'No power when charger plugged in; charging LED blinks amber.',
        diagnosisNotes: 'Initial intake complete. Scheduled for motherboard power rail check.',
        status: 'Received',
        estimatedCost: 150,
        finalCost: 150,
        amountPaid: 0,
        paymentStatus: 'Unpaid',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
        completedAt: null,
      },
    ],
  };
}

function loadStore(): StoreState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createInitialSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw) as StoreState;
}

function saveStore(state: StoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  const tempPath = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempPath, DATA_FILE);
}

let store: StoreState = loadStore();

interface AuthedRequest extends Request {
  user?: {
    id: number;
    email: string;
    fullName: string;
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({detail: 'Authentication required.'});
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({detail: 'Invalid or expired session token.'});
  }
  const user = store.users.find((u) => u.id === payload.sub);
  if (!user) {
    return res.status(401).json({detail: 'User account not found.'});
  }
  req.user = {id: user.id, email: user.email, fullName: user.fullName};
  next();
}

function enrichRepair(r: RepairRequest): RepairRequest {
  const customer = store.customers.find((c) => c.id === r.customerId);
  const device = store.devices.find((d) => d.id === r.deviceId);
  return {
    ...r,
    customerName: customer?.name ?? 'Unknown Customer',
    customerPhone: customer?.phone ?? '',
    deviceType: device?.deviceType ?? 'Phone',
    deviceBrand: device?.brand ?? '',
    deviceModel: device?.model ?? 'Unknown Device',
    deviceSerial: device?.serialNumber ?? '',
  };
}

const VALID_STATUSES: RepairStatus[] = [
  'Received',
  'In Progress',
  'Ready',
  'Collected',
];
const VALID_DEVICE_TYPES: DeviceType[] = ['Phone', 'Laptop'];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', app: 'FixTrack'});
  });

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (fullName.length < 2) {
      return res
        .status(400)
        .json({detail: 'Full name must be at least 2 characters.'});
    }
    if (!email.includes('@') || email.length < 5) {
      return res.status(400).json({detail: 'Please enter a valid email address.'});
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({detail: 'Password must be at least 6 characters.'});
    }
    if (store.users.some((u) => u.email === email)) {
      return res
        .status(409)
        .json({detail: 'An account with this email already exists.'});
    }

    const newUser: StoredUser = {
      id: store.nextIds.user++,
      fullName,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveStore(store);

    const token = signJwt({
      sub: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
    });
    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      return res
        .status(400)
        .json({detail: 'Email and password are required.'});
    }

    const user = store.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({detail: 'Invalid email or password.'});
    }

    const token = signJwt({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
    });
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const user = store.users.find((u) => u.id === req.user!.id)!;
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, (_req, res) => {
    const statusCounts = {
      Received: 0,
      'In Progress': 0,
      Ready: 0,
      Collected: 0,
    };
    let totalRevenueCollected = 0;
    let totalExpectedRevenue = 0;

    for (const r of store.repairs) {
      statusCounts[r.status] += 1;
      totalRevenueCollected += Number(r.amountPaid) || 0;
      totalExpectedRevenue += Number(r.finalCost) || 0;
    }

    const sortedRepairs = [...store.repairs]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map(enrichRepair);

    const unpaidRepairs = sortedRepairs.filter(
      (r) => r.paymentStatus !== 'Paid',
    );

    res.json({
      totalRepairs: store.repairs.length,
      totalCustomers: store.customers.length,
      totalDevices: store.devices.length,
      statusCounts,
      totalRevenueCollected: Number(totalRevenueCollected.toFixed(2)),
      totalExpectedRevenue: Number(totalExpectedRevenue.toFixed(2)),
      outstandingBalance: Number(
        Math.max(0, totalExpectedRevenue - totalRevenueCollected).toFixed(2),
      ),
      recentRepairs: sortedRepairs.slice(0, 6),
      unpaidRepairs: unpaidRepairs.slice(0, 5),
    });
  });

  // Customers CRUD + Search
  app.get('/api/customers', requireAuth, (req, res) => {
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const list = store.customers
      .filter((c) => {
        if (!search) return true;
        return (
          c.name.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
        );
      })
      .map((c) => {
        const customerDevices = store.devices.filter((d) => d.customerId === c.id);
        const customerRepairs = store.repairs.filter((r) => r.customerId === c.id);
        const totalSpent = customerRepairs.reduce(
          (sum, r) => sum + (Number(r.amountPaid) || 0),
          0,
        );
        return {
          ...c,
          deviceCount: customerDevices.length,
          repairCount: customerRepairs.length,
          totalSpent: Number(totalSpent.toFixed(2)),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(list);
  });

  app.post('/api/customers', requireAuth, (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const address = String(req.body?.address ?? '').trim();
    const notes = String(req.body?.notes ?? '').trim();

    if (name.length < 2) {
      return res
        .status(400)
        .json({detail: 'Customer name must be at least 2 characters.'});
    }
    if (phone.length < 5) {
      return res
        .status(400)
        .json({detail: 'Please provide a valid phone number.'});
    }

    const customer: Customer = {
      id: store.nextIds.customer++,
      name,
      phone,
      email,
      address,
      notes,
      createdAt: new Date().toISOString(),
    };
    store.customers.push(customer);
    saveStore(store);

    res.status(201).json({
      ...customer,
      deviceCount: 0,
      repairCount: 0,
      totalSpent: 0,
    });
  });

  app.get('/api/customers/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const customer = store.customers.find((c) => c.id === id);
    if (!customer) {
      return res.status(404).json({detail: 'Customer not found.'});
    }
    const devices = store.devices
      .filter((d) => d.customerId === id)
      .map((d) => ({
        ...d,
        repairCount: store.repairs.filter((r) => r.deviceId === d.id).length,
      }));
    const repairs = store.repairs
      .filter((r) => r.customerId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map(enrichRepair);

    const totalSpent = repairs.reduce(
      (sum, r) => sum + (Number(r.amountPaid) || 0),
      0,
    );

    res.json({
      ...customer,
      deviceCount: devices.length,
      repairCount: repairs.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      devices,
      repairs,
    });
  });

  app.put('/api/customers/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const idx = store.customers.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({detail: 'Customer not found.'});
    }

    const name = String(req.body?.name ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const address = String(req.body?.address ?? '').trim();
    const notes = String(req.body?.notes ?? '').trim();

    if (name.length < 2) {
      return res
        .status(400)
        .json({detail: 'Customer name must be at least 2 characters.'});
    }
    if (phone.length < 5) {
      return res
        .status(400)
        .json({detail: 'Please provide a valid phone number.'});
    }

    store.customers[idx] = {
      ...store.customers[idx],
      name,
      phone,
      email,
      address,
      notes,
    };
    saveStore(store);

    res.json(store.customers[idx]);
  });

  app.delete('/api/customers/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const exists = store.customers.some((c) => c.id === id);
    if (!exists) {
      return res.status(404).json({detail: 'Customer not found.'});
    }

    store.customers = store.customers.filter((c) => c.id !== id);
    store.devices = store.devices.filter((d) => d.customerId !== id);
    store.repairs = store.repairs.filter((r) => r.customerId !== id);
    saveStore(store);

    res.json({message: 'Customer deleted.'});
  });

  // Devices CRUD
  app.get('/api/devices', requireAuth, (req, res) => {
    const customerId = req.query.customerId
      ? Number(req.query.customerId)
      : null;
    const typeFilter = String(req.query.type ?? '').trim();
    const search = String(req.query.search ?? '').trim().toLowerCase();

    const list = store.devices
      .filter((d) => {
        if (customerId && d.customerId !== customerId) return false;
        if (
          typeFilter &&
          VALID_DEVICE_TYPES.includes(typeFilter as DeviceType) &&
          d.deviceType !== typeFilter
        ) {
          return false;
        }
        const owner = store.customers.find((c) => c.id === d.customerId);
        if (search) {
          const hay =
            `${d.brand} ${d.model} ${d.serialNumber} ${owner?.name ?? ''}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .map((d) => {
        const owner = store.customers.find((c) => c.id === d.customerId);
        return {
          ...d,
          customerName: owner?.name ?? 'Unknown',
          customerPhone: owner?.phone ?? '',
          repairCount: store.repairs.filter((r) => r.deviceId === d.id).length,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(list);
  });

  app.post('/api/devices', requireAuth, (req, res) => {
    const customerId = Number(req.body?.customerId);
    const deviceType = String(req.body?.deviceType ?? '') as DeviceType;
    const brand = String(req.body?.brand ?? '').trim();
    const model = String(req.body?.model ?? '').trim();
    const serialNumber = String(req.body?.serialNumber ?? '').trim();

    if (!store.customers.some((c) => c.id === customerId)) {
      return res.status(404).json({detail: 'Selected customer does not exist.'});
    }
    if (!VALID_DEVICE_TYPES.includes(deviceType)) {
      return res
        .status(400)
        .json({detail: 'Device type must be Phone or Laptop.'});
    }
    if (!brand || !model) {
      return res
        .status(400)
        .json({detail: 'Brand and model are required.'});
    }

    const device: Device = {
      id: store.nextIds.device++,
      customerId,
      deviceType,
      brand,
      model,
      serialNumber,
      createdAt: new Date().toISOString(),
    };
    store.devices.push(device);
    saveStore(store);

    const owner = store.customers.find((c) => c.id === customerId);
    res.status(201).json({
      ...device,
      customerName: owner?.name ?? 'Unknown',
      customerPhone: owner?.phone ?? '',
      repairCount: 0,
    });
  });

  app.delete('/api/devices/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!store.devices.some((d) => d.id === id)) {
      return res.status(404).json({detail: 'Device not found.'});
    }
    store.devices = store.devices.filter((d) => d.id !== id);
    store.repairs = store.repairs.filter((r) => r.deviceId !== id);
    saveStore(store);
    res.json({message: 'Device deleted.'});
  });

  // Repairs CRUD + Status & Payment Updates
  app.get('/api/repairs', requireAuth, (req, res) => {
    const status = String(req.query.status ?? '').trim();
    const paymentStatus = String(req.query.paymentStatus ?? '').trim();
    const search = String(req.query.search ?? '').trim().toLowerCase();

    const list = store.repairs
      .map(enrichRepair)
      .filter((r) => {
        if (
          status &&
          VALID_STATUSES.includes(status as RepairStatus) &&
          r.status !== status
        ) {
          return false;
        }
        if (
          paymentStatus &&
          ['Unpaid', 'Partial', 'Paid'].includes(paymentStatus) &&
          r.paymentStatus !== paymentStatus
        ) {
          return false;
        }
        if (search) {
          const hay =
            `${r.ticketCode} ${r.customerName} ${r.customerPhone} ${r.deviceBrand} ${r.deviceModel} ${r.issueDescription}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(list);
  });

  app.post('/api/repairs', requireAuth, (req, res) => {
    const customerId = Number(req.body?.customerId);
    const deviceId = Number(req.body?.deviceId);
    const issueDescription = String(req.body?.issueDescription ?? '').trim();
    const diagnosisNotes = String(req.body?.diagnosisNotes ?? '').trim();
    const estimatedCost = Number(req.body?.estimatedCost);
    const finalCostInput =
      req.body?.finalCost !== undefined && req.body?.finalCost !== ''
        ? Number(req.body.finalCost)
        : estimatedCost;
    const amountPaidInput = Number(req.body?.amountPaid ?? 0);

    const customer = store.customers.find((c) => c.id === customerId);
    if (!customer) {
      return res.status(404).json({detail: 'Customer not found.'});
    }
    const device = store.devices.find(
      (d) => d.id === deviceId && d.customerId === customerId,
    );
    if (!device) {
      return res.status(404).json({
        detail: 'Selected device was not found for this customer.',
      });
    }
    if (issueDescription.length < 5) {
      return res.status(400).json({
        detail: 'Please describe the repair issue (at least 5 characters).',
      });
    }
    if (Number.isNaN(estimatedCost) || estimatedCost < 0) {
      return res
        .status(400)
        .json({detail: 'Estimated cost must be a valid non-negative amount.'});
    }
    if (Number.isNaN(amountPaidInput) || amountPaidInput < 0) {
      return res
        .status(400)
        .json({detail: 'Amount paid must be zero or greater.'});
    }

    const finalCost =
      Number.isNaN(finalCostInput) || finalCostInput < 0
        ? estimatedCost
        : finalCostInput;
    const nowIso = new Date().toISOString();
    const repair: RepairRequest = {
      id: store.nextIds.repair++,
      ticketCode: `FT-${store.nextIds.ticketNum++}`,
      customerId,
      deviceId,
      issueDescription,
      diagnosisNotes,
      status: 'Received',
      estimatedCost: Number(estimatedCost.toFixed(2)),
      finalCost: Number(finalCost.toFixed(2)),
      amountPaid: Number(amountPaidInput.toFixed(2)),
      paymentStatus: computePaymentStatus(finalCost, amountPaidInput),
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
    };
    store.repairs.push(repair);
    saveStore(store);

    res.status(201).json(enrichRepair(repair));
  });

  app.patch('/api/repairs/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const idx = store.repairs.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({detail: 'Repair ticket not found.'});
    }

    const current = store.repairs[idx];
    const nextStatus =
      req.body?.status !== undefined
        ? (String(req.body.status) as RepairStatus)
        : current.status;

    if (!VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({detail: 'Invalid repair status.'});
    }

    const nextDiagnosis =
      req.body?.diagnosisNotes !== undefined
        ? String(req.body.diagnosisNotes).trim()
        : current.diagnosisNotes;

    const nextIssue =
      req.body?.issueDescription !== undefined
        ? String(req.body.issueDescription).trim()
        : current.issueDescription;

    if (nextIssue.length < 5) {
      return res
        .status(400)
        .json({detail: 'Issue description must be at least 5 characters.'});
    }

    const nextFinalCost =
      req.body?.finalCost !== undefined
        ? Number(req.body.finalCost)
        : current.finalCost;

    const nextAmountPaid =
      req.body?.amountPaid !== undefined
        ? Number(req.body.amountPaid)
        : current.amountPaid;

    if (Number.isNaN(nextFinalCost) || nextFinalCost < 0) {
      return res
        .status(400)
        .json({detail: 'Final cost must be zero or greater.'});
    }
    if (Number.isNaN(nextAmountPaid) || nextAmountPaid < 0) {
      return res
        .status(400)
        .json({detail: 'Amount paid must be zero or greater.'});
    }

    const nowIso = new Date().toISOString();
    const completedAt =
      nextStatus === 'Ready' || nextStatus === 'Collected'
        ? current.completedAt || nowIso
        : null;

    const updated: RepairRequest = {
      ...current,
      status: nextStatus,
      issueDescription: nextIssue,
      diagnosisNotes: nextDiagnosis,
      finalCost: Number(nextFinalCost.toFixed(2)),
      amountPaid: Number(nextAmountPaid.toFixed(2)),
      paymentStatus: computePaymentStatus(nextFinalCost, nextAmountPaid),
      updatedAt: nowIso,
      completedAt,
    };

    store.repairs[idx] = updated;
    saveStore(store);

    res.json(enrichRepair(updated));
  });

  app.delete('/api/repairs/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!store.repairs.some((r) => r.id === id)) {
      return res.status(404).json({detail: 'Repair ticket not found.'});
    }
    store.repairs = store.repairs.filter((r) => r.id !== id);
    saveStore(store);
    res.json({message: 'Repair ticket deleted.'});
  });

  // Vite middleware in dev / static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
