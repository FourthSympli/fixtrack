const API = window.FixTrackAPI;

const state = {
  user: null,
  authMode: "login",
  view: "dashboard",
  search: "",
  statusFilter: "",
  paymentFilter: "",
  deviceTypeFilter: "",
  customers: [],
  devices: [],
  repairs: [],
  stats: null,
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function usd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusClass(status) {
  if (status === "Received") return "status-received";
  if (status === "In Progress") return "status-progress";
  if (status === "Ready") return "status-ready";
  return "status-collected";
}

function payClass(status) {
  if (status === "Paid") return "pay-paid";
  if (status === "Partial") return "pay-partial";
  return "pay-unpaid";
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

function openModal(title, html) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
}

function closeDrawer() {
  document.getElementById("drawer-backdrop").classList.add("hidden");
}

function setAuthMode(mode) {
  state.authMode = mode;
  document.getElementById("tab-login").classList.toggle("active", mode === "login");
  document.getElementById("tab-register").classList.toggle("active", mode === "register");
  document.getElementById("register-name-group").classList.toggle("hidden", mode === "login");
  document.getElementById("demo-credentials-row").classList.toggle("hidden", mode === "register");
  document.getElementById("auth-title").textContent =
    mode === "login" ? "Sign in to shop dashboard" : "Create staff account";
  document.getElementById("auth-submit-btn").textContent =
    mode === "login" ? "Sign In" : "Create Account";
  document.getElementById("auth-error").classList.add("hidden");
}

function switchView(viewName) {
  state.view = viewName;
  const titles = {
    dashboard: "Dashboard",
    repairs: "Repair Tickets",
    customers: "Customers",
    devices: "Devices",
  };
  document.getElementById("page-title").textContent = titles[viewName] || "Dashboard";
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
  document.querySelectorAll(".view-section").forEach((sec) => {
    sec.classList.toggle("hidden", sec.id !== `view-${viewName}`);
  });
  document.getElementById("sidebar").classList.remove("open");
}

async function loadAllData() {
  const [stats, customers, devices, repairs] = await Promise.all([
    API.getStats(),
    API.getCustomers(state.search),
    API.getDevices({ device_type: state.deviceTypeFilter, search: state.search }),
    API.getRepairs({
      status: state.statusFilter,
      payment_status: state.paymentFilter,
      search: state.search,
    }),
  ]);
  state.stats = stats;
  state.customers = customers;
  state.devices = devices;
  state.repairs = repairs;
  renderDashboard();
  renderRepairs();
  renderCustomers();
  renderDevices();
}

function renderDashboard() {
  const s = state.stats;
  if (!s) return;
  const activeCount = (s.status_counts["Received"] || 0) + (s.status_counts["In Progress"] || 0);

  document.getElementById("kpi-grid").innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Repairs</div>
      <div class="kpi-value mono">${s.total_repairs}</div>
      <div class="kpi-sub">${s.total_customers} customers · ${s.total_devices} devices</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active In Shop</div>
      <div class="kpi-value mono" style="color:#2563eb">${activeCount}</div>
      <div class="kpi-sub">${s.status_counts["Received"] || 0} received · ${s.status_counts["In Progress"] || 0} in progress</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Ready for Pickup</div>
      <div class="kpi-value mono" style="color:#16a34a">${s.status_counts["Ready"] || 0}</div>
      <div class="kpi-sub">${s.status_counts["Collected"] || 0} collected</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Collected Revenue</div>
      <div class="kpi-value mono">${usd(s.total_revenue_collected)}</div>
      <div class="kpi-sub mono">${usd(s.outstanding_balance)} unpaid balance</div>
    </div>
  `;

  document.getElementById("total-billed-label").textContent = `Total Billed: ${usd(s.total_expected_revenue)}`;

  const stages = ["Received", "In Progress", "Ready", "Collected"];
  document.getElementById("pipeline-grid").innerHTML = stages
    .map((stage) => {
      const count = s.status_counts[stage] || 0;
      const pct = s.total_repairs > 0 ? Math.round((count / s.total_repairs) * 100) : 0;
      return `
        <button type="button" class="pipeline-card" data-jump-status="${stage}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="status-tag ${statusClass(stage)}">${stage}</span>
            <span class="mono-small">${pct}%</span>
          </div>
          <div class="kpi-value mono" style="margin-top:0.6rem;font-size:1.25rem;">${count}</div>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll("[data-jump-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.statusFilter = btn.dataset.jumpStatus;
      syncRepairTabs();
      switchView("repairs");
      loadAllData();
    });
  });

  document.getElementById("recent-repairs-body").innerHTML =
    s.recent_repairs.length === 0
      ? `<tr><td colspan="5" class="muted" style="text-align:center;padding:1.5rem;">No repair tickets yet.</td></tr>`
      : s.recent_repairs
          .map(
            (r) => `
          <tr style="cursor:pointer" data-open-repair="${r.id}">
            <td class="mono">${esc(r.ticket_code)}</td>
            <td><strong>${esc(r.customer_name)}</strong><div class="muted-small">${esc(r.device_brand)} ${esc(r.device_model)}</div></td>
            <td><span class="status-tag ${statusClass(r.status)}">${esc(r.status)}</span></td>
            <td class="text-right mono">${usd(r.final_cost)}</td>
            <td class="text-right"><span class="status-tag ${payClass(r.payment_status)}">${esc(r.payment_status)}</span></td>
          </tr>`,
          )
          .join("");

  document.getElementById("unpaid-list").innerHTML =
    s.unpaid_repairs.length === 0
      ? `<div class="muted" style="padding:1.5rem;text-align:center;">All tickets are fully paid.</div>`
      : s.unpaid_repairs
          .map((r) => {
            const bal = Math.max(0, r.final_cost - r.amount_paid);
            return `
            <button type="button" class="unpaid-item" data-open-repair="${r.id}">
              <div>
                <strong>${esc(r.customer_name)}</strong>
                <div class="muted-small">${esc(r.ticket_code)} · ${esc(r.device_brand)} ${esc(r.device_model)}</div>
              </div>
              <div class="text-right">
                <strong class="mono">${usd(bal)}</strong>
                <div class="muted-small">${esc(r.payment_status)}</div>
              </div>
            </button>`;
          })
          .join("");

  bindRepairOpenButtons();
}

function renderRepairs() {
  const tbody = document.getElementById("repairs-table-body");
  if (state.repairs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted" style="text-align:center;padding:2rem;">No matching repair requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.repairs
    .map(
      (r) => `
      <tr>
        <td class="mono"><strong>${esc(r.ticket_code)}</strong><div class="muted-small">${shortDate(r.created_at)}</div></td>
        <td><strong>${esc(r.customer_name)}</strong><div class="muted-small">${esc(r.customer_phone)}</div></td>
        <td><strong>${esc(r.device_brand)} ${esc(r.device_model)}</strong><div class="muted-small">${esc(r.issue_description)}</div></td>
        <td>
          <select class="quick-status-select" data-id="${r.id}" style="width:auto;padding:0.25rem 0.5rem;font-size:0.78rem;">
            ${["Received", "In Progress", "Ready", "Collected"]
              .map((st) => `<option value="${st}" ${r.status === st ? "selected" : ""}>${st}</option>`)
              .join("")}
          </select>
        </td>
        <td class="text-right mono">${usd(r.final_cost)}</td>
        <td class="text-right mono">${usd(r.amount_paid)}</td>
        <td class="text-right"><span class="status-tag ${payClass(r.payment_status)}">${esc(r.payment_status)}</span></td>
        <td class="text-right"><button type="button" class="btn-link" data-open-repair="${r.id}">Manage</button></td>
      </tr>
    `,
    )
    .join("");

  document.querySelectorAll(".quick-status-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try {
        await API.updateRepair(Number(sel.dataset.id), { status: sel.value });
        showToast(`Ticket updated to ${sel.value}`);
        await loadAllData();
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  bindRepairOpenButtons();
}

function renderCustomers() {
  const tbody = document.getElementById("customers-table-body");
  if (state.customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:2rem;">No customers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.customers
    .map(
      (c) => `
      <tr>
        <td>
          <button type="button" class="btn-link" data-view-customer="${c.id}">${esc(c.name)}</button>
          <div class="muted-small">${esc(c.address || "")}</div>
        </td>
        <td><div class="mono" style="font-size:0.8rem;">${esc(c.phone)}</div><div class="muted-small">${esc(c.email || "—")}</div></td>
        <td class="text-right mono">${c.device_count}</td>
        <td class="text-right mono">${c.repair_count}</td>
        <td class="text-right mono">${usd(c.total_spent)}</td>
        <td class="text-right">
          <button type="button" class="btn-link" data-view-customer="${c.id}">History</button>
          &nbsp;
          <button type="button" class="btn-link" data-edit-customer="${c.id}">Edit</button>
          &nbsp;
          <button type="button" class="btn-link" style="color:#dc2626" data-delete-customer="${c.id}">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");

  document.querySelectorAll("[data-view-customer]").forEach((btn) => {
    btn.addEventListener("click", () => openCustomerDrawer(Number(btn.dataset.viewCustomer)));
  });

  document.querySelectorAll("[data-edit-customer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cust = state.customers.find((c) => c.id === Number(btn.dataset.editCustomer));
      if (cust) openCustomerFormModal(cust);
    });
  });

  document.querySelectorAll("[data-delete-customer]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.deleteCustomer);
      const cust = state.customers.find((c) => c.id === id);
      openModal(
        "Delete Customer",
        `<p>Are you sure you want to delete <strong>${esc(cust?.name)}</strong> and all associated devices and repairs?</p>
         <div class="modal-actions">
           <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
           <button type="button" id="confirm-del-cust" class="btn btn-danger">Delete</button>
         </div>`,
      );
      document.getElementById("confirm-del-cust").addEventListener("click", async () => {
        await API.deleteCustomer(id);
        closeModal();
        showToast("Customer deleted.");
        await loadAllData();
      });
    });
  });
}

function renderDevices() {
  const tbody = document.getElementById("devices-table-body");
  if (state.devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:2rem;">No devices registered.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.devices
    .map(
      (d) => `
      <tr>
        <td><strong>${esc(d.brand)} ${esc(d.model)}</strong></td>
        <td>${esc(d.device_type)}</td>
        <td class="mono">${esc(d.serial_number || "—")}</td>
        <td><button type="button" class="btn-link" data-view-customer-dev="${d.customer_id}">${esc(d.customer_name)}</button></td>
        <td class="text-right mono">${d.repair_count}</td>
        <td class="text-right">
          <button type="button" class="btn-link" data-repair-device="${d.id}">+ Repair</button>
          &nbsp;
          <button type="button" class="btn-link" style="color:#dc2626" data-delete-device="${d.id}">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");

  document.querySelectorAll("[data-view-customer-dev]").forEach((btn) => {
    btn.addEventListener("click", () => openCustomerDrawer(Number(btn.dataset.viewCustomerDev)));
  });

  document.querySelectorAll("[data-repair-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = state.devices.find((item) => item.id === Number(btn.dataset.repairDevice));
      if (d) openNewRepairModal(d.customer_id, d.id);
    });
  });

  document.querySelectorAll("[data-delete-device]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await API.deleteDevice(Number(btn.dataset.deleteDevice));
      showToast("Device deleted.");
      await loadAllData();
    });
  });
}

function bindRepairOpenButtons() {
  document.querySelectorAll("[data-open-repair]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.openRepair);
      const repair =
        state.repairs.find((r) => r.id === id) ||
        state.stats?.recent_repairs.find((r) => r.id === id);
      if (repair) openRepairManageModal(repair);
    });
  });
}

function openCustomerFormModal(customer = null) {
  openModal(
    customer ? "Edit Customer" : "Add Customer",
    `<form id="customer-form" class="form-stack">
      <div id="modal-err" class="alert-error hidden"></div>
      <div class="form-row-2">
        <div class="form-group"><label>Full Name *</label><input id="c-name" required value="${esc(customer?.name || "")}" /></div>
        <div class="form-group"><label>Phone *</label><input id="c-phone" required value="${esc(customer?.phone || "")}" /></div>
      </div>
      <div class="form-group"><label>Email</label><input id="c-email" type="email" value="${esc(customer?.email || "")}" /></div>
      <div class="form-group"><label>Address</label><input id="c-address" value="${esc(customer?.address || "")}" /></div>
      <div class="form-group"><label>Notes</label><textarea id="c-notes" rows="2">${esc(customer?.notes || "")}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${customer ? "Save Changes" : "Add Customer"}</button>
      </div>
    </form>`,
  );

  document.getElementById("customer-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("c-name").value,
      phone: document.getElementById("c-phone").value,
      email: document.getElementById("c-email").value,
      address: document.getElementById("c-address").value,
      notes: document.getElementById("c-notes").value,
    };
    try {
      if (customer) {
        await API.updateCustomer(customer.id, payload);
        showToast("Customer updated.");
      } else {
        await API.createCustomer(payload);
        showToast("Customer added.");
      }
      closeModal();
      await loadAllData();
    } catch (err) {
      const errBox = document.getElementById("modal-err");
      errBox.textContent = err.message;
      errBox.classList.remove("hidden");
    }
  });
}

function openDeviceFormModal(defaultCustomerId = null) {
  const options = state.customers
    .map(
      (c) => `<option value="${c.id}" ${c.id === defaultCustomerId ? "selected" : ""}>${esc(c.name)} (${esc(c.phone)})</option>`,
    )
    .join("");

  openModal(
    "Add Customer Device",
    `<form id="device-form" class="form-stack">
      <div id="modal-err" class="alert-error hidden"></div>
      <div class="form-group"><label>Customer *</label><select id="d-customer" required>${options}</select></div>
      <div class="form-group"><label>Device Type *</label>
        <select id="d-type">
          <option value="Phone">Phone</option>
          <option value="Laptop">Laptop</option>
        </select>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label>Brand *</label><input id="d-brand" required placeholder="Apple" /></div>
        <div class="form-group"><label>Model *</label><input id="d-model" required placeholder="iPhone 15" /></div>
      </div>
      <div class="form-group"><label>Serial / IMEI</label><input id="d-serial" class="mono" placeholder="Optional" /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Device</button>
      </div>
    </form>`,
  );

  document.getElementById("device-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await API.createDevice({
        customer_id: Number(document.getElementById("d-customer").value),
        device_type: document.getElementById("d-type").value,
        brand: document.getElementById("d-brand").value,
        model: document.getElementById("d-model").value,
        serial_number: document.getElementById("d-serial").value,
      });
      closeModal();
      showToast("Device registered.");
      await loadAllData();
    } catch (err) {
      const errBox = document.getElementById("modal-err");
      errBox.textContent = err.message;
      errBox.classList.remove("hidden");
    }
  });
}

function openNewRepairModal(defaultCustomerId = null, defaultDeviceId = null) {
  if (state.customers.length === 0) {
    showToast("Add a customer first before creating a repair ticket.");
    openCustomerFormModal();
    return;
  }

  const initialCustomerId = defaultCustomerId || state.customers[0].id;
  const custOptions = state.customers
    .map(
      (c) => `<option value="${c.id}" ${c.id === initialCustomerId ? "selected" : ""}>${esc(c.name)} (${esc(c.phone)})</option>`,
    )
    .join("");

  openModal(
    "Create New Repair Ticket",
    `<form id="repair-form" class="form-stack">
      <div id="modal-err" class="alert-error hidden"></div>
      <div class="form-group"><label>Customer *</label><select id="r-customer">${custOptions}</select></div>
      <div class="form-group"><label>Device *</label><select id="r-device"></select></div>
      <div class="form-group"><label>Issue Description *</label><textarea id="r-issue" rows="3" required minlength="5" placeholder="Describe the issue..."></textarea></div>
      <div class="form-group"><label>Intake Notes</label><input id="r-notes" placeholder="Accessories, visible marks..." /></div>
      <div class="form-row-2">
        <div class="form-group"><label>Estimated Cost (USD) *</label><input id="r-est" type="number" step="0.01" min="0" required value="95" /></div>
        <div class="form-group"><label>Deposit Paid (USD)</label><input id="r-paid" type="number" step="0.01" min="0" value="0" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Ticket</button>
      </div>
    </form>`,
  );

  const custSelect = document.getElementById("r-customer");
  const devSelect = document.getElementById("r-device");

  function populateDevices() {
    const cid = Number(custSelect.value);
    const matching = state.devices.filter((d) => d.customer_id === cid);
    if (matching.length === 0) {
      devSelect.innerHTML = `<option value="">No devices for this customer — add a device first</option>`;
    } else {
      devSelect.innerHTML = matching
        .map(
          (d) => `<option value="${d.id}" ${d.id === defaultDeviceId ? "selected" : ""}>${esc(d.device_type)}: ${esc(d.brand)} ${esc(d.model)}</option>`,
        )
        .join("");
    }
  }

  custSelect.addEventListener("change", populateDevices);
  populateDevices();

  document.getElementById("repair-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const deviceId = Number(devSelect.value);
    if (!deviceId) {
      const errBox = document.getElementById("modal-err");
      errBox.textContent = "Please register a device for this customer first.";
      errBox.classList.remove("hidden");
      return;
    }
    try {
      const created = await API.createRepair({
        customer_id: Number(custSelect.value),
        device_id: deviceId,
        issue_description: document.getElementById("r-issue").value,
        diagnosis_notes: document.getElementById("r-notes").value,
        estimated_cost: Number(document.getElementById("r-est").value),
        amount_paid: Number(document.getElementById("r-paid").value || 0),
      });
      closeModal();
      showToast(`Ticket ${created.ticket_code} created.`);
      await loadAllData();
    } catch (err) {
      const errBox = document.getElementById("modal-err");
      errBox.textContent = err.message;
      errBox.classList.remove("hidden");
    }
  });
}

function openRepairManageModal(repair) {
  openModal(
    `Ticket ${repair.ticket_code} — ${repair.customer_name}`,
    `<form id="manage-repair-form" class="form-stack">
      <div id="modal-err" class="alert-error hidden"></div>
      <div class="muted-small">Device: <strong>${esc(repair.device_brand)} ${esc(repair.device_model)}</strong> · Estimate: ${usd(repair.estimated_cost)}</div>
      <div class="form-group"><label>Repair Status</label>
        <select id="mr-status">
          ${["Received", "In Progress", "Ready", "Collected"]
            .map((st) => `<option value="${st}" ${repair.status === st ? "selected" : ""}>${st}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group"><label>Issue Description</label><textarea id="mr-issue" rows="2" required>${esc(repair.issue_description)}</textarea></div>
      <div class="form-group"><label>Technician Diagnosis Notes</label><textarea id="mr-notes" rows="2">${esc(repair.diagnosis_notes)}</textarea></div>
      <div class="form-row-2">
        <div class="form-group"><label>Final Cost (USD)</label><input id="mr-cost" type="number" step="0.01" min="0" value="${repair.final_cost}" /></div>
        <div class="form-group"><label>Amount Paid (USD)</label><input id="mr-paid" type="number" step="0.01" min="0" value="${repair.amount_paid}" /></div>
      </div>
      <div class="modal-actions" style="justify-content:space-between;">
        <button type="button" id="mr-delete-btn" class="btn btn-danger">Delete</button>
        <div style="display:flex;gap:0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
          <button type="submit" class="btn btn-primary">Save Ticket</button>
        </div>
      </div>
    </form>`,
  );

  document.getElementById("manage-repair-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await API.updateRepair(repair.id, {
        status: document.getElementById("mr-status").value,
        issue_description: document.getElementById("mr-issue").value,
        diagnosis_notes: document.getElementById("mr-notes").value,
        final_cost: Number(document.getElementById("mr-cost").value),
        amount_paid: Number(document.getElementById("mr-paid").value),
      });
      closeModal();
      showToast(`Ticket ${repair.ticket_code} saved.`);
      await loadAllData();
    } catch (err) {
      const errBox = document.getElementById("modal-err");
      errBox.textContent = err.message;
      errBox.classList.remove("hidden");
    }
  });

  document.getElementById("mr-delete-btn").addEventListener("click", async () => {
    await API.deleteRepair(repair.id);
    closeModal();
    showToast(`Ticket ${repair.ticket_code} deleted.`);
    await loadAllData();
  });
}

async function openCustomerDrawer(customerId) {
  document.getElementById("drawer-backdrop").classList.remove("hidden");
  document.getElementById("drawer-body").innerHTML = `<p class="muted">Loading details...</p>`;
  try {
    const d = await API.getCustomerDetail(customerId);
    document.getElementById("drawer-title").textContent = d.name;
    document.getElementById("drawer-body").innerHTML = `
      <div class="kpi-card" style="margin-bottom:1.25rem;">
        <div><strong>Phone:</strong> <span class="mono">${esc(d.phone)}</span></div>
        <div><strong>Email:</strong> ${esc(d.email || "—")}</div>
        <div><strong>Address:</strong> ${esc(d.address || "—")}</div>
        <div style="margin-top:0.5rem;"><strong>Total Paid:</strong> <span class="mono">${usd(d.total_spent)}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
        <h4 style="margin:0;">Registered Devices (${d.devices.length})</h4>
        <button type="button" class="btn-link" id="drawer-add-dev">+ Add Device</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem;">
        ${
          d.devices.length === 0
            ? `<p class="muted-small">No devices registered.</p>`
            : d.devices
                .map(
                  (dev) => `<div class="kpi-card" style="padding:0.75rem;display:flex;justify-content:space-between;align-items:center;">
                    <div><strong>${esc(dev.brand)} ${esc(dev.model)}</strong><div class="muted-small mono">${esc(dev.device_type)} · ${esc(dev.serial_number || "No serial")}</div></div>
                  </div>`,
                )
                .join("")
        }
      </div>
      <h4 style="margin:0 0 0.65rem;">Repair History (${d.repairs.length})</h4>
      <div style="display:flex;flex-direction:column;gap:0.65rem;">
        ${
          d.repairs.length === 0
            ? `<p class="muted-small">No repair history.</p>`
            : d.repairs
                .map(
                  (r) => `<div class="kpi-card" style="padding:0.85rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <strong class="mono">${esc(r.ticket_code)} · ${esc(r.device_brand)} ${esc(r.device_model)}</strong>
                      <span class="status-tag ${statusClass(r.status)}">${esc(r.status)}</span>
                    </div>
                    <p style="margin:0.4rem 0;font-size:0.82rem;">${esc(r.issue_description)}</p>
                    <div class="muted-small mono">${shortDate(r.created_at)} · Paid ${usd(r.amount_paid)} / ${usd(r.final_cost)} (${esc(r.payment_status)})</div>
                  </div>`,
                )
                .join("")
        }
      </div>
    `;
    document.getElementById("drawer-add-dev").addEventListener("click", () => {
      closeDrawer();
      openDeviceFormModal(d.id);
    });
  } catch (err) {
    document.getElementById("drawer-body").innerHTML = `<div class="alert-error">${esc(err.message)}</div>`;
  }
}

function syncRepairTabs() {
  document.querySelectorAll("#status-filter-tabs .seg-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.status === state.statusFilter);
  });
}

function enterApp(user) {
  state.user = user;
  document.getElementById("user-name").textContent = user.full_name;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-shell").classList.remove("hidden");
  loadAllData();
}

function leaveApp() {
  API.setToken(null);
  state.user = null;
  document.getElementById("app-shell").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
}

window.closeModal = closeModal;

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("tab-login").addEventListener("click", () => setAuthMode("login"));
  document.getElementById("tab-register").addEventListener("click", () => setAuthMode("register"));

  document.getElementById("fill-demo-btn").addEventListener("click", () => {
    setAuthMode("login");
    document.getElementById("auth-email").value = "tech@fixtrack.local";
    document.getElementById("auth-password").value = "fixtrack123";
  });

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("auth-error");
    errEl.classList.add("hidden");
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const fullName = document.getElementById("auth-fullname").value;

    try {
      const res =
        state.authMode === "login"
          ? await API.login({ email, password })
          : await API.register({ full_name: fullName, email, password });
      API.setToken(res.access_token);
      enterApp(res.user);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", leaveApp);
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("drawer-close-btn").addEventListener("click", closeDrawer);

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.getElementById("open-sidebar-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
  });
  document.getElementById("close-sidebar-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
  });

  document.getElementById("global-search").addEventListener("input", (e) => {
    state.search = e.target.value;
    loadAllData();
  });

  document.querySelectorAll("#status-filter-tabs .seg-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.statusFilter = btn.dataset.status;
      syncRepairTabs();
      loadAllData();
    });
  });

  document.getElementById("payment-filter-select").addEventListener("change", (e) => {
    state.paymentFilter = e.target.value;
    loadAllData();
  });

  document.querySelectorAll("#device-type-tabs .seg-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.deviceTypeFilter = btn.dataset.type;
      document.querySelectorAll("#device-type-tabs .seg-tab").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      loadAllData();
    });
  });

  document.getElementById("open-new-repair-btn").addEventListener("click", () => openNewRepairModal());
  document.getElementById("add-customer-btn").addEventListener("click", () => openCustomerFormModal());
  document.getElementById("add-device-btn").addEventListener("click", () => openDeviceFormModal());

  if (API.getToken()) {
    try {
      const me = await API.me();
      enterApp(me);
    } catch {
      leaveApp();
    }
  }
});
