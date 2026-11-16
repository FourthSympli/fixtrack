/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useEffect, useState} from 'react';
import {Menu, Plus, Search} from 'lucide-react';
import {AuthScreen} from './components/AuthScreen.tsx';
import {CustomersView} from './components/CustomersView.tsx';
import {DashboardView} from './components/DashboardView.tsx';
import {DevicesView} from './components/DevicesView.tsx';
import {
  ConfirmDeleteModal,
  CustomerDetailDrawer,
  CustomerModal,
  DeviceModal,
  NewRepairModal,
  RepairDetailModal,
} from './components/Modals.tsx';
import {RepairsView} from './components/RepairsView.tsx';
import {NavSection, Sidebar} from './components/Sidebar.tsx';
import {api, getStoredToken, setStoredToken} from './lib/api.ts';
import type {
  Customer,
  DashboardStats,
  Device,
  RepairRequest,
  RepairStatus,
  StaffUser,
} from './types.ts';

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  repairs: 'Repair Tickets',
  customers: 'Customers',
  devices: 'Devices',
};

export default function App() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [section, setSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('All');

  // Modals & Drawers
  const [showNewRepair, setShowNewRepair] = useState<{
    open: boolean;
    customerId?: number;
    deviceId?: number;
  }>({open: false});
  const [editingRepair, setEditingRepair] = useState<RepairRequest | null>(
    null,
  );
  const [customerModal, setCustomerModal] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({open: false, customer: null});
  const [deviceModal, setDeviceModal] = useState<{
    open: boolean;
    customerId?: number;
  }>({open: false});
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'customer' | 'device';
    id: number;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [drawerCustomerId, setDrawerCustomerId] = useState<number | null>(null);
  const [drawerRefresh, setDrawerRefresh] = useState(0);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .me()
      .then((me) => setUser(me))
      .catch(() => setStoredToken(null))
      .finally(() => setAuthChecking(false));
  }, []);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [statsRes, customersRes, devicesRes, repairsRes] =
        await Promise.all([
          api.getDashboardStats(),
          api.getCustomers(searchQuery),
          api.getDevices({
            type: deviceTypeFilter === 'All' ? '' : deviceTypeFilter,
            search: searchQuery,
          }),
          api.getRepairs({
            status: statusFilter === 'All' ? '' : statusFilter,
            paymentStatus: paymentFilter === 'All' ? '' : paymentFilter,
            search: searchQuery,
          }),
        ]);
      setStats(statsRes);
      setCustomers(customersRes);
      setDevices(devicesRes);
      setRepairs(repairsRes);
      setDrawerRefresh((n) => n + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load shop data.',
      );
    } finally {
      setLoadingData(false);
    }
  }, [user, searchQuery, deviceTypeFilter, statusFilter, paymentFilter, showToast]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setStats(null);
  };

  const handleQuickStatusChange = async (
    repair: RepairRequest,
    nextStatus: RepairStatus,
  ) => {
    try {
      await api.updateRepair(repair.id, {status: nextStatus});
      showToast(`${repair.ticketCode} moved to ${nextStatus}`);
      refreshAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'customer') {
        await api.deleteCustomer(deleteTarget.id);
        if (drawerCustomerId === deleteTarget.id) setDrawerCustomerId(null);
        showToast(`Customer "${deleteTarget.name}" deleted`);
      } else {
        await api.deleteDevice(deleteTarget.id);
        showToast(`Device "${deleteTarget.name}" deleted`);
      }
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading FixTrack...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeSection={section}
        onSelectSection={setSection}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">FixTrack</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 truncate">
                {SECTION_TITLES[section]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden sm:block w-56 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, ticket, device..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowNewRepair({open: true})}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>New Repair</span>
            </button>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, ticket, device..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {section === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loadingData}
              onOpenRepair={(repair) => setEditingRepair(repair)}
              onJumpToStatus={(status) => {
                setStatusFilter(status);
                setSection('repairs');
              }}
              onOpenNewRepair={() => setShowNewRepair({open: true})}
            />
          )}

          {section === 'repairs' && (
            <RepairsView
              repairs={repairs}
              loading={loadingData}
              statusFilter={statusFilter}
              paymentFilter={paymentFilter}
              onStatusFilterChange={setStatusFilter}
              onPaymentFilterChange={setPaymentFilter}
              onQuickStatusChange={handleQuickStatusChange}
              onOpenRepair={(repair) => setEditingRepair(repair)}
              onOpenNewRepair={() => setShowNewRepair({open: true})}
            />
          )}

          {section === 'customers' && (
            <CustomersView
              customers={customers}
              loading={loadingData}
              onAddCustomer={() =>
                setCustomerModal({open: true, customer: null})
              }
              onEditCustomer={(customer) =>
                setCustomerModal({open: true, customer})
              }
              onDeleteCustomer={(customer) =>
                setDeleteTarget({
                  type: 'customer',
                  id: customer.id,
                  name: customer.name,
                })
              }
              onViewCustomer={(id) => setDrawerCustomerId(id)}
            />
          )}

          {section === 'devices' && (
            <DevicesView
              devices={devices}
              loading={loadingData}
              typeFilter={deviceTypeFilter}
              onTypeFilterChange={setDeviceTypeFilter}
              onAddDevice={() => setDeviceModal({open: true})}
              onDeleteDevice={(device) =>
                setDeleteTarget({
                  type: 'device',
                  id: device.id,
                  name: `${device.brand} ${device.model}`,
                })
              }
              onViewCustomer={(id) => setDrawerCustomerId(id)}
              onLogRepairForDevice={(device) =>
                setShowNewRepair({
                  open: true,
                  customerId: device.customerId,
                  deviceId: device.id,
                })
              }
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      {customerModal.open && (
        <CustomerModal
          customer={customerModal.customer}
          onClose={() => setCustomerModal({open: false, customer: null})}
          onSaved={(saved) => {
            setCustomerModal({open: false, customer: null});
            showToast(`Customer "${saved.name}" saved`);
            refreshAll();
          }}
        />
      )}

      {deviceModal.open && (
        <DeviceModal
          customers={customers}
          defaultCustomerId={deviceModal.customerId}
          onClose={() => setDeviceModal({open: false})}
          onSaved={(saved) => {
            setDeviceModal({open: false});
            showToast(`Device "${saved.brand} ${saved.model}" registered`);
            refreshAll();
          }}
        />
      )}

      {showNewRepair.open && (
        <NewRepairModal
          customers={customers}
          devices={devices}
          defaultCustomerId={showNewRepair.customerId}
          defaultDeviceId={showNewRepair.deviceId}
          onClose={() => setShowNewRepair({open: false})}
          onDeviceAdded={(newDev) => setDevices((prev) => [newDev, ...prev])}
          onCreated={(repair) => {
            setShowNewRepair({open: false});
            showToast(`Repair ticket ${repair.ticketCode} created`);
            refreshAll();
          }}
        />
      )}

      {editingRepair && (
        <RepairDetailModal
          repair={editingRepair}
          onClose={() => setEditingRepair(null)}
          onUpdated={(updated) => {
            setEditingRepair(null);
            showToast(`Ticket ${updated.ticketCode} updated`);
            refreshAll();
          }}
          onDeleted={() => {
            setEditingRepair(null);
            showToast('Repair ticket deleted');
            refreshAll();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete ${
            deleteTarget.type === 'customer' ? 'Customer' : 'Device'
          }`}
          message={
            deleteTarget.type === 'customer'
              ? `Are you sure you want to delete "${deleteTarget.name}"? This will also remove their registered devices and repair tickets.`
              : `Are you sure you want to delete "${deleteTarget.name}" and its repair tickets?`
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
        />
      )}

      {drawerCustomerId !== null && (
        <CustomerDetailDrawer
          customerId={drawerCustomerId}
          onClose={() => setDrawerCustomerId(null)}
          onAddDeviceForCustomer={(cid) =>
            setDeviceModal({open: true, customerId: cid})
          }
          onNewRepairForCustomer={(cid, did) =>
            setShowNewRepair({open: true, customerId: cid, deviceId: did})
          }
          onOpenRepair={(repair) => setEditingRepair(repair)}
          refreshSignal={drawerRefresh}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
