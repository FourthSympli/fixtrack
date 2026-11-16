import React from 'react';
import {
  formatShortDate,
  formatUsd,
  paymentStatusClasses,
  repairStatusClasses,
} from '../lib/format.ts';
import type {DashboardStats, RepairRequest, RepairStatus} from '../types.ts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onOpenRepair: (repair: RepairRequest) => void;
  onJumpToStatus: (status: RepairStatus) => void;
  onOpenNewRepair: () => void;
}

const STATUS_ORDER: RepairStatus[] = [
  'Received',
  'In Progress',
  'Ready',
  'Collected',
];

export function DashboardView({
  stats,
  loading,
  onOpenRepair,
  onJumpToStatus,
  onOpenNewRepair,
}: DashboardViewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded-xl p-5 h-28 animate-pulse"
            />
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl h-72 animate-pulse" />
      </div>
    );
  }

  const activeInShop =
    stats.statusCounts.Received + stats.statusCounts['In Progress'];

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Repairs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalRepairs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.totalCustomers} customers · {stats.totalDevices} devices
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Active In Shop</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 font-mono tabular-nums">
            {activeInShop}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.statusCounts.Received} received ·{' '}
            {stats.statusCounts['In Progress']} in progress
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Ready for Pickup
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {stats.statusCounts.Ready}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.statusCounts.Collected} collected to date
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Collected Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatUsd(stats.totalRevenueCollected)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatUsd(stats.outstandingBalance)} unpaid balance
          </p>
        </div>
      </div>

      {/* Status Pipeline Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Repair Pipeline Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a stage to inspect filtered repair tickets.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Total Billed: {formatUsd(stats.totalExpectedRevenue)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_ORDER.map((status) => {
            const count = stats.statusCounts[status];
            const pct =
              stats.totalRepairs > 0
                ? Math.round((count / stats.totalRepairs) * 100)
                : 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onJumpToStatus(status)}
                className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${repairStatusClasses(
                      status,
                    )}`}>
                    {status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {pct}%
                  </span>
                </div>
                <p className="mt-2.5 text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Repairs & Unpaid Balances */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Repair Tickets
            </h2>
            <button
              type="button"
              onClick={onOpenNewRepair}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer">
              + New Repair
            </button>
          </div>

          {stats.recentRepairs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">
                No repair tickets logged yet.
              </p>
              <button
                type="button"
                onClick={onOpenNewRepair}
                className="mt-3 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                Log First Repair
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-4">Customer & Device</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Cost</th>
                    <th className="py-2.5 px-4 text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {stats.recentRepairs.map((repair) => (
                    <tr
                      key={repair.id}
                      onClick={() => onOpenRepair(repair)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                        {repair.ticketCode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">
                          {repair.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {repair.deviceBrand} {repair.deviceModel} ·{' '}
                          {formatShortDate(repair.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${repairStatusClasses(
                            repair.status,
                          )}`}>
                          {repair.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                        {formatUsd(repair.finalCost)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${paymentStatusClasses(
                            repair.paymentStatus,
                          )}`}>
                          {repair.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Unpaid Balances */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Pending Payments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tickets with unpaid or partial balances.
            </p>
          </div>

          <div className="divide-y divide-slate-200 flex-1">
            {stats.unpaidRepairs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                All repair tickets are fully paid.
              </div>
            ) : (
              stats.unpaidRepairs.map((repair) => {
                const balance = Math.max(
                  0,
                  repair.finalCost - repair.amountPaid,
                );
                return (
                  <button
                    key={repair.id}
                    type="button"
                    onClick={() => onOpenRepair(repair)}
                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {repair.customerName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {repair.ticketCode} · {repair.deviceBrand}{' '}
                        {repair.deviceModel}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                        {formatUsd(balance)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {repair.paymentStatus}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
