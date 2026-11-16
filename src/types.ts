export type RepairStatus = 'Received' | 'In Progress' | 'Ready' | 'Collected';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';
export type DeviceType = 'Phone' | 'Laptop';

export interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  deviceCount?: number;
  repairCount?: number;
  totalSpent?: number;
}

export interface Device {
  id: number;
  customerId: number;
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  repairCount?: number;
}

export interface RepairRequest {
  id: number;
  ticketCode: string;
  customerId: number;
  deviceId: number;
  issueDescription: string;
  diagnosisNotes: string;
  status: RepairStatus;
  estimatedCost: number;
  finalCost: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customerName?: string;
  customerPhone?: string;
  deviceType?: DeviceType;
  deviceBrand?: string;
  deviceModel?: string;
  deviceSerial?: string;
}

export interface CustomerDetail extends Customer {
  devices: Device[];
  repairs: RepairRequest[];
}

export interface DashboardStats {
  totalRepairs: number;
  totalCustomers: number;
  totalDevices: number;
  statusCounts: {
    Received: number;
    'In Progress': number;
    Ready: number;
    Collected: number;
  };
  totalRevenueCollected: number;
  totalExpectedRevenue: number;
  outstandingBalance: number;
  recentRepairs: RepairRequest[];
  unpaidRepairs: RepairRequest[];
}
