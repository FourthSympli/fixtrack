import React from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {formatShortDate, formatUsd} from '../lib/format.ts';
import type {Customer} from '../types.ts';

interface CustomersViewProps {
  customers: Customer[];
  loading: boolean;
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onViewCustomer: (customerId: number) => void;
}

export function CustomersView({
  customers,
  loading,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onViewCustomer,
}: CustomersViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a customer to view registered devices and full repair
            history.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCustomer}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No customers found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add your first customer to begin tracking devices and repairs.
            </p>
            <button
              type="button"
              onClick={onAddCustomer}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
              Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Devices</th>
                  <th className="py-3 px-4 text-right">Repairs</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onViewCustomer(customer.id)}
                        className="text-left font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                        {customer.name}
                      </button>
                      {customer.address && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {customer.address}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-mono text-xs tabular-nums">
                        {customer.phone}
                      </p>
                      <p className="text-xs text-slate-500">
                        {customer.email || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {customer.deviceCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {customer.repairCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatUsd(customer.totalSpent ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatShortDate(customer.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewCustomer(customer.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer">
                          History
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditCustomer(customer)}
                          aria-label={`Edit ${customer.name}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomer(customer)}
                          aria-label={`Delete ${customer.name}`}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
