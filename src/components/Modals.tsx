import React, {useEffect, useState} from 'react';
import {Laptop, Smartphone, X} from 'lucide-react';
import {api} from '../lib/api.ts';
import {
  formatShortDate,
  formatUsd,
  paymentStatusClasses,
  repairStatusClasses,
} from '../lib/format.ts';
import type {
  Customer,
  CustomerDetail,
  Device,
  DeviceType,
  RepairRequest,
  RepairStatus,
} from '../types.ts';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({title, subtitle, onClose, children}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

export function CustomerModal({
  customer,
  onClose,
  onSaved,
}: CustomerModalProps) {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = customer
        ? await api.updateCustomer(customer.id, {
            name,
            phone,
            email,
            address,
            notes,
          })
        : await api.createCustomer({name, phone, email, address, notes});
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save customer.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={customer ? 'Edit Customer' : 'Add Customer'}
      subtitle="Store contact details for repair updates and receipts."
      onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maya Lin"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(415) 555-0142"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="412 Maple Street"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pickup preferences or special instructions"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg cursor-pointer">
            {saving ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface DeviceModalProps {
  customers: Customer[];
  defaultCustomerId?: number;
  onClose: () => void;
  onSaved: (device: Device) => void;
}

export function DeviceModal({
  customers,
  defaultCustomerId,
  onClose,
  onSaved,
}: DeviceModalProps) {
  const [customerId, setCustomerId] = useState<number>(
    defaultCustomerId || customers[0]?.id || 0,
  );
  const [deviceType, setDeviceType] = useState<DeviceType>('Phone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = await api.createDevice({
        customerId,
        deviceType,
        brand,
        model,
        serialNumber,
      });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Register Customer Device"
      subtitle="Add a phone or laptop linked to a customer."
      onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Customer *
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
            <option value={0} disabled>
              Select a customer
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Device Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Phone', 'Laptop'] as DeviceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeviceType(type)}
                className={`py-2 px-3 text-xs font-medium border rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                  deviceType === type
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                {type === 'Phone' ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Laptop className="w-4 h-4" />
                )}
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Brand *
            </label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Apple / Samsung / Dell"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="iPhone 15 / MacBook Air M2"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Serial Number / IMEI
          </label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Optional serial or IMEI"
            className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !customerId}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg cursor-pointer">
            {saving ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface NewRepairModalProps {
  customers: Customer[];
  devices: Device[];
  defaultCustomerId?: number;
  defaultDeviceId?: number;
  onClose: () => void;
  onCreated: (repair: RepairRequest) => void;
  onDeviceAdded: (device: Device) => void;
}

export function NewRepairModal({
  customers,
  devices,
  defaultCustomerId,
  defaultDeviceId,
  onClose,
  onCreated,
  onDeviceAdded,
}: NewRepairModalProps) {
  const initialCustomerId =
    defaultCustomerId ||
    devices.find((d) => d.id === defaultDeviceId)?.customerId ||
    customers[0]?.id ||
    0;

  const [customerId, setCustomerId] = useState<number>(initialCustomerId);
  const customerDevices = devices.filter((d) => d.customerId === customerId);
  const [deviceId, setDeviceId] = useState<number>(
    defaultDeviceId || customerDevices[0]?.id || 0,
  );
  const [addingInlineDevice, setAddingInlineDevice] = useState(false);
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>('Phone');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');

  const [issueDescription, setIssueDescription] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('95');
  const [amountPaid, setAmountPaid] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const matching = devices.filter((d) => d.customerId === customerId);
    if (!matching.some((d) => d.id === deviceId)) {
      setDeviceId(matching[0]?.id || 0);
    }
  }, [customerId, devices, deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let targetDeviceId = deviceId;
      if (addingInlineDevice || targetDeviceId === 0) {
        const createdDevice = await api.createDevice({
          customerId,
          deviceType: newDeviceType,
          brand: newBrand,
          model: newModel,
          serialNumber: newSerial,
        });
        onDeviceAdded(createdDevice);
        targetDeviceId = createdDevice.id;
      }

      const repair = await api.createRepair({
        customerId,
        deviceId: targetDeviceId,
        issueDescription,
        diagnosisNotes,
        estimatedCost: Number(estimatedCost),
        amountPaid: Number(amountPaid || 0),
      });
      onCreated(repair);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create repair ticket.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Create New Repair Ticket"
      subtitle="Ticket will open in Received status."
      onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Customer *
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
            <option value={0} disabled>
              Select customer
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700">
              Device *
            </label>
            <button
              type="button"
              onClick={() => setAddingInlineDevice((v) => !v)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              {addingInlineDevice || customerDevices.length === 0
                ? 'Choose existing device'
                : '+ Register new device'}
            </button>
          </div>

          {addingInlineDevice || customerDevices.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['Phone', 'Laptop'] as DeviceType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewDeviceType(t)}
                    className={`py-1.5 text-xs font-medium border rounded-md cursor-pointer ${
                      newDeviceType === t
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Brand (e.g. Apple)"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="Model (e.g. iPhone 15)"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>
              <input
                type="text"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="Serial / IMEI (optional)"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
              />
            </div>
          ) : (
            <select
              required
              value={deviceId}
              onChange={(e) => setDeviceId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
              {customerDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deviceType}: {d.brand} {d.model}{' '}
                  {d.serialNumber ? `(${d.serialNumber})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Issue Description *
          </label>
          <textarea
            required
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the reported fault (e.g. cracked screen, battery drain, charging port loose)"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Initial Intake Notes
          </label>
          <input
            type="text"
            value={diagnosisNotes}
            onChange={(e) => setDiagnosisNotes(e.target.value)}
            placeholder="Visible scratches, accessories included, passcode notes"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Estimated Cost (USD) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Deposit Paid (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !customerId}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg cursor-pointer">
            {saving ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface RepairDetailModalProps {
  repair: RepairRequest;
  onClose: () => void;
  onUpdated: (repair: RepairRequest) => void;
  onDeleted: (id: number) => void;
}

export function RepairDetailModal({
  repair,
  onClose,
  onUpdated,
  onDeleted,
}: RepairDetailModalProps) {
  const [status, setStatus] = useState<RepairStatus>(repair.status);
  const [issueDescription, setIssueDescription] = useState(
    repair.issueDescription,
  );
  const [diagnosisNotes, setDiagnosisNotes] = useState(repair.diagnosisNotes);
  const [finalCost, setFinalCost] = useState(String(repair.finalCost));
  const [amountPaid, setAmountPaid] = useState(String(repair.amountPaid));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const numericFinal = Number(finalCost || 0);
  const numericPaid = Number(amountPaid || 0);
  const balanceDue = Math.max(0, numericFinal - numericPaid);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.updateRepair(repair.id, {
        status,
        issueDescription,
        diagnosisNotes,
        finalCost: numericFinal,
        amountPaid: numericPaid,
      });
      onUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update repair ticket.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.deleteRepair(repair.id);
      onDeleted(repair.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete repair ticket.',
      );
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Ticket ${repair.ticketCode}`}
      subtitle={`${repair.customerName} · ${repair.deviceBrand} ${repair.deviceModel}`}
      onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="text-slate-500">Created:</span>{' '}
            <span className="font-medium text-slate-800">
              {formatShortDate(repair.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Estimate:</span>{' '}
            <span className="font-mono font-medium text-slate-800">
              {formatUsd(repair.estimatedCost)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Balance Due:</span>{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatUsd(balanceDue)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Repair Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              ['Received', 'In Progress', 'Ready', 'Collected'] as RepairStatus[]
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`py-2 px-2 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                  status === st
                    ? repairStatusClasses(st)
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Issue Description
          </label>
          <textarea
            rows={2}
            required
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Technician Diagnosis & Repair Notes
          </label>
          <textarea
            rows={2}
            value={diagnosisNotes}
            onChange={(e) => setDiagnosisNotes(e.target.value)}
            placeholder="Parts replaced, testing results, or customer notes"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Final Cost (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Amount Paid (USD)
              </label>
              <button
                type="button"
                onClick={() => setAmountPaid(finalCost)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                Mark Paid Full
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-medium">
                Delete this ticket?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer">
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
              Delete Ticket
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg cursor-pointer">
              {saving ? 'Saving...' : 'Save Ticket'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function ConfirmDeleteModal({
  title,
  message,
  onCancel,
  onConfirm,
  deleting,
}: ConfirmDeleteModalProps) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
          Cancel
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg cursor-pointer">
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </ModalShell>
  );
}

interface CustomerDetailDrawerProps {
  customerId: number;
  onClose: () => void;
  onAddDeviceForCustomer: (customerId: number) => void;
  onNewRepairForCustomer: (customerId: number, deviceId?: number) => void;
  onOpenRepair: (repair: RepairRequest) => void;
  refreshSignal: number;
}

export function CustomerDetailDrawer({
  customerId,
  onClose,
  onAddDeviceForCustomer,
  onNewRepairForCustomer,
  onOpenRepair,
  refreshSignal,
}: CustomerDetailDrawerProps) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getCustomerDetail(customerId)
      .then((data) => {
        if (active) {
          setDetail(data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load customer details.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [customerId, refreshSignal]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40">
      <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {detail ? detail.name : 'Customer Details'}
            </h3>
            <p className="text-xs text-slate-500">
              Profile, registered devices, and repair history
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : error || !detail ? (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error || 'Customer not found.'}
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Phone
                  </span>
                  <span className="font-mono text-xs text-slate-900">
                    {detail.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Email
                  </span>
                  <span className="text-xs text-slate-900">
                    {detail.email || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Address
                  </span>
                  <span className="text-xs text-slate-900">
                    {detail.address || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500">
                    Total Paid to Shop
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatUsd(detail.totalSpent ?? 0)}
                  </span>
                </div>
                {detail.notes && (
                  <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                    {detail.notes}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Registered Devices ({detail.devices.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => onAddDeviceForCustomer(detail.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    + Add Device
                  </button>
                </div>

                {detail.devices.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                    No devices registered for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.devices.map((device) => (
                      <div
                        key={device.id}
                        className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {device.brand} {device.model}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {device.deviceType} ·{' '}
                            {device.serialNumber || 'No serial'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onNewRepairForCustomer(detail.id, device.id)
                          }
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md whitespace-nowrap cursor-pointer">
                          + New Repair
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Repair History ({detail.repairs.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => onNewRepairForCustomer(detail.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    + Log Repair
                  </button>
                </div>

                {detail.repairs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                    No repair history recorded for this customer.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {detail.repairs.map((repair) => (
                      <button
                        key={repair.id}
                        type="button"
                        onClick={() => onOpenRepair(repair)}
                        className="w-full text-left p-3.5 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {repair.ticketCode} · {repair.deviceBrand}{' '}
                            {repair.deviceModel}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-medium border rounded ${repairStatusClasses(
                              repair.status,
                            )}`}>
                            {repair.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                          {repair.issueDescription}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {formatShortDate(repair.createdAt)}
                          </span>
                          <span className="font-mono tabular-nums text-slate-800">
                            Paid {formatUsd(repair.amountPaid)} /{' '}
                            {formatUsd(repair.finalCost)} ·{' '}
                            <span
                              className={`px-1.5 py-0.5 rounded border ${paymentStatusClasses(
                                repair.paymentStatus,
                              )}`}>
                              {repair.paymentStatus}
                            </span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
