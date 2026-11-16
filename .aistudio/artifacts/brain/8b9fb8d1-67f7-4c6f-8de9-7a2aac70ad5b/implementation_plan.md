# FixTrack – Repair Shop Management System

FixTrack is a student-friendly full-stack repair shop management system designed for a small mobile phone and laptop repair shop to track customers, devices, repair tickets, status progression, and payments. It delivers both a live interactive web preview in AI Studio and a complete, beginner-friendly Python, FastAPI, PostgreSQL, Pytest, and Docker codebase.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Preferences & Preview Alignment**: Your Phase 1 selections shape the entire build—live AI Studio preview alongside full Python/FastAPI project files, single technician/shop staff access, mobile phone and laptop repairs in USD, and a clean light sidebar dashboard with blue accents.

- **Delivery Mode (Confirmed)**: We will build a live, database-backed web application running in the AI Studio preview AND generate a complete standalone Python/FastAPI/PostgreSQL/HTML-CSS-JS/Pytest/Docker project ready to run locally.
- **Authentication Strategy**: The standalone Python/FastAPI project implements standard email/password registration and login using JWT tokens and hashed passwords. For the live AI Studio preview backed by Cloud SQL (PostgreSQL), platform security uses Google Sign-In to protect API endpoints while automatically registering your shop staff profile—if Cloud SQL is unavailable or declined during setup, the preview gracefully adapts to local server storage with standard JWT login.
- **Shop Scope & Currency (Confirmed)**: Sample data and workflows focus on smartphones and laptops (screen replacements, battery swaps, charging ports, hinge/keyboard repairs) with all pricing formatted in USD (`$`).
- **Visual Direction (Confirmed)**: Clean light-mode workspace with a fixed left sidebar, crisp white surfaces, subtle `1px` borders, and focused blue primary actions.

---

### 1. Overview & Core Concept

- **What It Does**: Gives a small repair shop a single organized workspace to register staff, manage customer records, log incoming phones and laptops, create repair requests with estimated and final costs, move tickets through four clear repair stages (`Received` → `In Progress` → `Ready` → `Collected`), and record customer payments (`Unpaid`, `Partial`, `Paid`).
- **Target Audience / Persona**: A student developer learning full-stack architecture and a small independent mobile/laptop repair technician managing daily walk-in repairs at the counter.
- **Key Value**: Replaces messy paper tickets and spreadsheets with instant customer search, transparent repair status tracking, and accurate revenue/balance visibility without enterprise bloat.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Staff Sign-In & Onboarding**: User arrives at a clean centered authentication screen to sign in (or register a new technician account in the standalone app), then lands directly on the Repair Dashboard.
  2. **Dashboard Overview**: At-a-glance KPI strip (Total Repairs, Active In-Shop, Ready for Pickup, Collected Revenue in USD) with a breakdown by status, recent repair tickets, and unpaid balance alerts.
  3. **Customer Management & Detail Drawer**: Searchable customer directory (by name, phone, or email) with inline Add/Edit/Delete modals. Clicking a customer opens their detail view showing contact info, registered devices, full repair history, and total spend.
  4. **Device & Repair Intake**: Guided form to pick an existing customer (or add one), register a device (brand, model, type: Phone/Laptop, serial/IMEI), describe the issue, set estimated cost, and create a ticket starting in `Received`.
  5. **Repair Queue & Status Updates**: Filterable repair board/table with segmented status tabs (`All`, `Received`, `In Progress`, `Ready`, `Collected`), one-click status advancement, technician notes, and payment recording (`Unpaid`, `Partial`, `Paid`, amount paid).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Clean, pragmatic student-built SaaS utility—structured, legible, and approachable without heavy gradients, glassmorphism, or decorative clutter.
  - *Color Palette & Mood* (60-30-10 distribution):
    - Dominant Canvas (`60%`): Soft cool off-white (`#F8FAFC`) paired with crisp white (`#FFFFFF`) content surfaces.
    - Structural Surfaces (`30%`): Slate-tinted hairline borders (`#E2E8F0`), slate body text (`#0F172A` primary, `#475569` secondary, `#64748B` muted metadata).
    - Accent & Semantic States (`10%`): Cobalt Blue (`#2563EB`) for primary CTAs and active sidebar navigation; semantic state colors strictly paired with explicit text labels—Amber (`#D97706`) for `Received` / `Partial`, Blue (`#2563EB`) for `In Progress`, Emerald (`#16A34A`) for `Ready` / `Paid`, Slate (`#475569`) for `Collected`, and Crimson (`#DC2626`) for `Unpaid` / delete confirmations.
  - *Typography & Hierarchy*:
    - Display & Headings: `Plus Jakarta Sans` (SemiBold 600 / Bold 700, balanced wrapping, `20px–28px` section headers).
    - Body & Tables: `DM Sans` (`14px–15px` readable prose, `12px–13px` muted metadata).
    - Financial & Numeric Data: `JetBrains Mono` with `tabular-nums` on all ticket IDs (`#FT-1001`), USD prices, payment balances, and counts so columns align cleanly.
  - *Component Styling & Layout*:
    - Fixed `240px` left sidebar on desktop (collapsible drawer on mobile) containing the `FixTrack` wordmark, 4 navigation links (`Dashboard`, `Repairs`, `Customers`, `Devices`), and technician sign-out action at the bottom.
    - Top bar adhering to a clean 3-zone structure: contextual breadcrumb on the left, live global search input in the middle/right, and a single primary `+ New Repair` action button.
    - Single-elevation flat cards with `1px` borders (no nested cards-within-cards), compact `40px` table rows, and clean unboxed metadata separated by `·` rather than pill badge clutter.
- **Interactive Feedback & Motion**:
  - Fast `150ms` transitions on hover/active tabs (`cubic-bezier(0.16, 1, 0.3, 1)`), subtle inline loading skeletons matching table row geometry, clear empty states with primary action triggers (e.g., `"Log First Repair"`), inline form validation errors, and non-blocking confirmation toasts when tickets or payments update.

---

### 3. Key Product Decisions & Trade-Offs

- **Dual Deliverable Architecture (Live Preview + Python FastAPI Codebase)**:
  - *Chosen Approach*: Power the live AI Studio preview with an Express + React + PostgreSQL stack on port 3000, while authoring a complete, self-contained Python + FastAPI + PostgreSQL + vanilla HTML/CSS/JS + Pytest + Docker + Postman project inside a dedicated folder in the workspace.
  - *Why*: AI Studio's live runtime executes Node/Vite on port 3000; this ensures you get an immediately testable live app right here *and* the exact beginner-friendly Python/FastAPI/Docker student project you requested without fake stubs.
  - *Alternatives Considered*: Writing only Python files (which would leave the AI Studio preview blank) or writing only Node files (which would miss your Python/FastAPI/Pytest requirement).
- **Single-Role Technician Access**:
  - *Chosen Approach*: All authenticated staff share one technician/shop-staff role with full CRUD access to customers, devices, repairs, and payments.
  - *Why*: Keeps the authentication logic, UI, and database rules clean and easy for a student to read and maintain, matching your confirmed preference.
  - *Alternatives Considered*: Multi-role RBAC (Admin vs. Technician vs. Customer portal), which adds unnecessary complexity for a small shop project.
- **Normalized Relational Schema with Explicit Payment Tracking**:
  - *Chosen Approach*: Separate `customers`, `devices`, and `repair_requests` tables linked by foreign keys, with explicit `estimated_cost`, `final_cost`, `amount_paid`, and `payment_status` fields on repair tickets (plus payment history timestamps).
  - *Why*: Supports multiple devices per customer and full repair history per device while keeping queries straightforward with standard SQL joins and ORM models.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    LIVE AI STUDIO PREVIEW (Port 3000)                │
│                                                                      │
│  ┌──────────────────────┐       REST JSON       ┌─────────────────┐  │
│  │  React + Tailwind    │ ◄───────────────────► │  Express API    │  │
│  │  Sidebar Dashboard   │   (Auth Bearer Token) │  Validation &   │  │
│  │  - KPI Overview      │                       │  Route Handlers │  │
│  │  - Customers & Detail│                       └────────┬────────┘  │
│  │  - Devices & Repairs │                                │           │
│  │  - Payment Tracking  │                       ┌────────▼────────┐  │
│  └──────────────────────┘                       │   PostgreSQL    │  │
│                                                 │   (Cloud SQL /  │  │
│                                                 │   Drizzle ORM)  │  │
│                                                 └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│         STANDALONE STUDENT PROJECT (Python / FastAPI / Docker)       │
│                                                                      │
│  ┌──────────────────────┐     HTTP + JWT        ┌─────────────────┐  │
│  │  HTML + CSS + JS     │ ◄───────────────────► │  FastAPI App    │  │
│  │  Responsive Sidebar  │  Authorization:       │  - Auth (JWT)   │  │
│  │  Dashboard & Modals  │  Bearer <token>       │  - Customers    │  │
│  └──────────────────────┘                       │  - Devices      │  │
│                                                 │  - Repairs/Pay  │  │
│  ┌──────────────────────┐                       └────────┬────────┘  │
│  │  Pytest + Postman    │                                │           │
│  │  Automated API Tests │                       ┌────────▼────────┐  │
│  └──────────────────────┘                       │   PostgreSQL    │  │
│                                                 │  (SQLAlchemy +  │  │
│                                                 │  Docker Compose)│  │
│                                                 └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Users (`users`)**: `id`, `uid` (for live preview Cloud SQL auth) / `email` + `hashed_password` (for FastAPI JWT), `full_name`, `created_at`.
  - **Customers (`customers`)**: `id`, `name`, `phone`, `email`, `address`, `notes`, `created_at`.
  - **Devices (`devices`)**: `id`, `customer_id` (FK → `customers.id`), `device_type` (`Phone` | `Laptop`), `brand`, `model`, `serial_number`, `created_at`.
  - **Repair Requests (`repair_requests`)**: `id`, `ticket_code` (e.g., `FT-1001`), `customer_id` (FK), `device_id` (FK), `issue_description`, `diagnosis_notes`, `status` (`Received` | `In Progress` | `Ready` | `Collected`), `estimated_cost` (USD), `final_cost` (USD), `amount_paid` (USD), `payment_status` (`Unpaid` | `Partial` | `Paid`), `created_at`, `updated_at`, `completed_at`.
- **Interactive Component & State Mapping**:
  - *Global Search & Status Filter*: Typing in the search bar or clicking segmented status tabs queries/filters customers, devices, and repairs by name, phone, ticket code, or device model, showing immediate empty states when no matches exist.
  - *Customer CRUD & Detail Panel*: Submitting the customer modal validates name and phone/email, writes to PostgreSQL, updates the list optimistically after server confirmation, and refreshes the detail panel showing linked devices and repair history. Delete actions use an inline confirmation dialog and prevent accidental loss (cascading or warning if active tickets exist).
  - *New Repair Intake*: Selecting a customer dynamically filters their registered devices (with an inline quick-add device option so intake never stalls), validates positive USD cost inputs, and creates a `Received` ticket.
  - *Status & Payment Updater*: Selecting a new status (`Received` → `In Progress` → `Ready` → `Collected`) or recording a payment recalculates `payment_status` (`amount_paid == 0` → `Unpaid`, `0 < amount_paid < final_cost` → `Partial`, `amount_paid >= final_cost` → `Paid`), persists via `PATCH`, and updates dashboard revenue and status counters immediately.
- **Seeded Sample Data & Testing**:
  - Automatic first-run seeding (only when tables are empty) with realistic mobile & laptop shop data in USD (e.g., iPhone 14 Pro screen replacement, MacBook Air M2 battery swap, Galaxy S23 charging port repair, Dell XPS 15 hinge repair) across all four repair statuses and payment states.
  - Standalone FastAPI project includes a Pytest suite covering auth registration/login, JWT protection, customer CRUD, repair status transitions, payment status calculation, and validation errors, plus a ready-to-import Postman collection and `Dockerfile` + `docker-compose.yml`.
