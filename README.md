# EmpOps: Unified Enterprise Workforce, ITAM & ITSM Operations Platform

> **A Next-Generation Monorepo uniting Human Resources (HRMS), IT Asset Management (ITAM), Smart Attendance, IT Service Management (ITIL ITSM), and Automated Electronic Exit Clearance into a single cohesive system.**

---

## 🚀 The Strategic Wedge: "The Employee-Asset-Ticket Trinity"

Conventional enterprises run fragmented tools: HR in one system, IT assets in a spreadsheet, service tickets in another tool, and exit clearances across manual emails. This causes ghost asset loss, onboarding delays, and compliance friction.

**EmpOps connects these domains into a closed-loop automated lifecycle:**

```
[1. HR Onboards Joiner] ──► ⚡ Auto-generates IT Hardware Provisioning Ticket
                                  │
                                  ▼
[2. IT Assigns Laptop]  ──► ⚡ Generates In-App Custody Receipt (PENDING_ACKNOWLEDGEMENT)
                                  │
                                  ▼
[3. Employee Portal]    ──► ⚡ Digitally Signs Custody Acceptance in ESS Portal
                                  │
                                  ▼
[4. Daily Operations]   ──► ⚡ Geofenced Mobile Punch, Shift Overtime & ITSM Incident Desk
                                  │
                                  ▼
[5. Resignation Exit]   ──► 🔒 Locks Full & Final (F&F) Settlement (IT NOC: BLOCKED)
                                  │
                                  ▼
[6. Hardware Returned]  ──► 🎉 ALL Devices Checked-In ──► AUTOMATED IT NOC ISSUED!
```

---

## 🌟 Key Platform Capabilities

### 1. Executive & IT Operations Command Centers
- **Interactive Pro-Grade Donut & Bar Visualizations**: Ultra-crisp vector graphics with `cornerRadius={8}`, linear gradient fills, and dark seam separation.
- **Center Telemetry Core (HUD)**: Real-time reactive donut core tracking fleet shares, in-stock safety buffers, and active custody.
- **Interactive KPI Filters & Cross-Page Drilldown**: Click any metric card (e.g. *Deployed to Employees*) to instantly filter records and 1-click jump to the ITAM Asset Manager with pre-applied status filters.
- **Backdrop Dismissal & Smooth Auto-Zoom**: Cards physically scale up smoothly on hover (`scale-[1.025]`, `-translate-y-1.5`, 2xl shadow elevation) with instant click-outside or `Esc` dismissal.

### 2. Tenant Master Inventory Catalog & Welcome Wizard
- **Universal Industry Archetypes**: 4 onboarding templates (`Tech / SaaS`, `Healthcare & Clinics`, `Logistics & Manufacturing`, `BFSI / Regulated FinTech`) that preconfigure custom equipment categories, tag prefixes, and safety buffer thresholds.
- **Tenant Custom Master Catalog**: Fully customizable categories (Laptops, Monitors, Medical Scanners, Handheld Terminals) with safe-deletion safeguards (soft-archives if assets are linked, hard-deletes if 0 assets).
- **Multi-Asset Inwarding (GRN)**: Warehouse Goods Receipt Note batch inwarding with automatic sequential barcode tag generation.

### 3. Integrated Native Grafana & NOC Telemetry Studio
- **100% In-App Observability**: Built-in time-series graphs, buffer depletion velocity, and TV Wallboard dark-mode telemetry.
- **Prometheus OpenMetrics Exporter (`/api/metrics`)**: Production-ready endpoint exposing gauges for external Grafana, Prometheus, or Datadog scrapers.

### 4. Smart Attendance & Statutory Labor Compliance
- **Geofenced GPS Punch**: Haversine radius validation for mobile check-ins with shift grace periods.
- **Hardware Biometric Ingestion**: Native endpoints for eSSL and ZKTeco ADMS push protocols.
- **Form 25 Statutory Muster Roll**: Official monthly payroll attendance roll exportable with 1-click to CSV.

### 5. AI ITSM Incident Diagnostic Copilot
- **Urgency Scoring & Root-Cause Playbooks**: Evaluates incident telemetry, detects probability patterns, and generates technician checklists.
- **AI Auto-Categorization**: 1-click classification of error logs and incident severity.

### 6. Cryptographic SHA-256 Certificates
- **Tamper-Evident Digital Custody Certificate**: Embedded Indian DPDP Act 2023 & ISO 27001 compliance with printable formatting.
- **Electronic IT NOC Certificate**: Cryptographically releases Full & Final (F&F) payroll once all assigned assets are accounted for.

---

## 🏗️ Architecture & Monorepo Structure

```
d:/HR-ITAM/
├── apps/
│   ├── api/                   # Express modular backend, JWT auth, Prisma ORM, AI Copilot, Metrics
│   └── web/                   # Vite, React 18, Tailwind CSS, Recharts, Lucide icons
├── packages/
│   ├── database/              # Multi-tenant Prisma schema, SQLite/PostgreSQL migrations & seed scripts
│   └── shared/                # Shared TypeScript models, Zod validation schemas, and system enums
├── docker-compose.prod.yml    # Turnkey production orchestration (Postgres, Redis, MinIO, Nginx)
└── .gitignore                 # Excludes node_modules, build outputs, and local databases
```

---

## ⚡ Quickstart Guide for Collaborators

### Prerequisites
- **Node.js**: v18+ (v20 recommended)
- **Git**: Installed and configured

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Install all monorepo dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy root or API environment template
cp apps/api/.env.example apps/api/.env
```

### 3. Initialize Database & Seed Demo Records
```bash
# Generate Prisma client
npm run db:generate

# Push schema to SQLite database (dev.db)
npm run db:push

# (Optional) Seed realistic sample employees, hardware assets, tickets, and attendance
npx tsx packages/database/src/seed.ts
```

### 4. Run Verification Tests
```bash
# Verify end-to-end Trinity integration flow (15/15 checks)
npx tsx apps/api/src/test-flow.ts

# Verify tenant customization & onboarding wizard templates
npx tsx apps/api/src/test-templates.ts
```

### 5. Launch Development Servers
Open two terminal windows:

**Terminal 1 — Backend API (Port 4005):**
```bash
cd apps/api
npm run dev
```

**Terminal 2 — Frontend Web SPA (Port 3005):**
```bash
cd apps/web
npm run dev
```

Now open [http://localhost:3005](http://localhost:3005) in your web browser!

---

## 🔑 Default Demo Credentials

All seed accounts use the default password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **HR Manager** | `hr@acme.com` | Workforce directory, Onboarding wizard, Attendance muster roll |
| **IT Manager** | `it@acme.com` | Hardware fleet, Master catalog, GRN inwarding, NOC clearances |
| **IT Technician** | `tech@acme.com` | Service desk queue, AI triage playbooks, SLA resolution |
| **Employee (ESS)** | `priya@acme.com` | Geofenced GPS punch, Digital custody sign-off, Support tickets |
| **Executive / Admin**| `admin@acme.com` | Executive command center, Valuation toggle, Enterprise audit trail |

---

## 🤝 Collaborating & Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push to your branch: `git push origin feature/your-feature-name`
4. Open a Pull Request on GitHub.
