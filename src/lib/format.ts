import type {PaymentStatus, RepairStatus} from '../types.ts';

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatShortDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function repairStatusClasses(status: RepairStatus): string {
  switch (status) {
    case 'Received':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Ready':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Collected':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function paymentStatusClasses(status: PaymentStatus): string {
  switch (status) {
    case 'Paid':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Partial':
      return 'text-amber-800 bg-amber-50 border-amber-200';
    case 'Unpaid':
      return 'text-red-700 bg-red-50 border-red-200';
  }
}
