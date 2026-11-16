import React from 'react';
import {Laptop, Plus, Smartphone, Trash2} from 'lucide-react';
import {formatShortDate} from '../lib/format.ts';
import type {Device} from '../types.ts';

interface DevicesViewProps {
  devices: Device[];
  loading: boolean;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  onAddDevice: () => void;
  onDeleteDevice: (device: Device) => void;
  onViewCustomer: (customerId: number) => void;
  onLogRepairForDevice: (device: Device) => void;
}

export function DevicesView({
  devices,
  loading,
  typeFilter,
  onTypeFilterChange,
  onAddDevice,
  onDeleteDevice,
  onViewCustomer,
  onLogRepairForDevice,
}: DevicesViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {['All', 'Phone', 'Laptop'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTypeFilterChange(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === t
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}>
              {t === 'All' ? 'All Devices' : `${t}s`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddDevice}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Add Device</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No devices registered
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add a customer&apos;s phone or laptop to log repair requests.
            </p>
            <button
              type="button"
              onClick={onAddDevice}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
              Add Device
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Serial / IMEI</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Repairs</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {device.deviceType === 'Phone' ? (
                          <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>
                          {device.brand} {device.model}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {device.deviceType}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {device.serialNumber || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onViewCustomer(device.customerId)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                        {device.customerName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {device.repairCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatShortDate(device.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onLogRepairForDevice(device)}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer">
                          + Repair
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDevice(device)}
                          aria-label={`Delete ${device.brand} ${device.model}`}
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
