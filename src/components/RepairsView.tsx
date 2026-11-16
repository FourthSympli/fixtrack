import React from 'react';
import {
  formatShortDate,
  formatUsd,
  paymentStatusClasses,
  repairStatusClasses,
} from '../lib/format.ts';
import type {PaymentStatus, RepairRequest, RepairStatus} from '../types.ts';

interface RepairsViewProps {
  repairs: RepairRequest[];
  loading: boolean;
  statusFilter: string;
  paymentFilter: string;
  onStatusFilterChange: (status: string) => void;
  onPaymentFilterChange: (payment: string) => void;
  onQuickStatusChange: (repair: RepairRequest, nextStatus: RepairStatus) => void;
  onOpenRepair: (repair: RepairRequest) => void;
  onOpenNewRepair: () => void;
}

const STATUS_TABS: string[] = [
  'All',
  'Received',
  'In Progress',
  'Ready',
  'Collected',
];
const PAYMENT_OPTIONS: string[] = ['All', 'Unpaid', 'Partial', 'Paid'];

export function RepairsView({
  repairs,
  loading,
  statusFilter,
  paymentFilter,
  onStatusFilterChange,
  onPaymentFilterChange,
  onQuickStatusChange,
  onOpenRepair,
  onOpenNewRepair,
}: RepairsViewProps) {
  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusFilterChange(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="payment-filter"
            className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Payment:
          </label>
          <select
            id="payment-filter"
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Payments' : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : repairs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No matching repair requests
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your filters or create a new repair ticket.
            </p>
            <button
              type="button"
              onClick={onOpenNewRepair}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
              + New Repair
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device & Issue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Final Cost</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {repairs.map((repair) => (
                  <tr
                    key={repair.id}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                      <div>{repair.ticketCode}</div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {formatShortDate(repair.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {repair.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {repair.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">
                        {repair.deviceBrand} {repair.deviceModel}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {repair.issueDescription}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        aria-label={`Status for ${repair.ticketCode}`}
                        value={repair.status}
                        onChange={(e) =>
                          onQuickStatusChange(
                            repair,
                            e.target.value as RepairStatus,
                          )
                        }
                        className={`px-2 py-1 text-xs font-medium border rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${repairStatusClasses(
                          repair.status,
                        )}`}>
                        <option value="Received">Received</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready">Ready</option>
                        <option value="Collected">Collected</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {formatUsd(repair.finalCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {formatUsd(repair.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${paymentStatusClasses(
                          repair.paymentStatus as PaymentStatus,
                        )}`}>
                        {repair.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenRepair(repair)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
