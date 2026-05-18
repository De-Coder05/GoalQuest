# Atomberg Performance Portal

An enterprise-grade, high-fidelity Employee Goal Setting & Tracking Web Application engineered to align individual objectives with corporate strategic priorities. Developed strictly in accordance with the Atomberg Business Requirement Document (BRD) and optimized for seamless role-based workflows, rigorous business validation, and compliance.

Live Portal: **[https://goal-quest-sable.vercel.app](https://goal-quest-sable.vercel.app)**
Repository: **[https://github.com/De-Coder05/GoalQuest](https://github.com/De-Coder05/GoalQuest)**

---

## 🚀 Key Features & BRD Compliance

### 1. Role-Based Access Control (RBAC) & Portals
- **Employee Journey:** Seamless drafting, updating, and deleting of goals during draft cycles. Submit sheets for review, track quarterly check-ins (Q1-Q4), and log target progress with automated calculations.
- **Manager Journey:** A comprehensive dashboard to monitor team lists, perform inline goal review/edits, push department-level shared goals, log check-in feedback, and review overall manager effectiveness scores.
- **Admin / HR Journey:** Advanced administration tools to manage appraisal cycles (Draft, Active, Finished), view aggregate company metrics, inspect complete system-wide audit trails, and trigger automated compliance reports.

### 2. Rigorous Goal Sheet Validation
- **Constraint Enforcement:** 
  - Maximum of **8 goals** allowed per employee per cycle.
  - Minimum of **10% weightage** enforced per individual goal.
  - Total weightage across all goals in a sheet **must equal 100%** exactly before submission is allowed.
- **State-Locked Security:** Goals are automatically locked upon manager approval. Locked goals can never be deleted or modified by employees (only Admins retain emergency override access). All CRUD modifications strictly check goal state rules at the database API layer.
- **Shared KPI Syncing:** Admin or Manager can push a single organizational/departmental KPI to multiple employees. Recipients can adjust weightage only (Title and Target are read-only). Logged achievements by the primary owner automatically sync across all linked sheets.

### 3. Comprehensive Audit Trail & Governance
- Every state change, goal modification, submission, approval, and achievement check-in is logged in the `AuditLog` table.
- Each entry captures the exact Timestamp, Action, Modified Field, User, Old Value, and New Value to guarantee full regulatory audit capability.

### 4. Advanced Performance Analytics
- Automatically calculates and renders:
  - **Quarter-on-Quarter (QoQ) Achievement Trends** (Line charts)
  - **Thrust Area Distribution** (Pie/Donut charts demonstrating strategic alignment)
  - **Manager Engagement & Effectiveness Index** (Bar charts showing check-in completion rates)
  - **Performance status distributions** (On Track, Off Track, At Risk)

---

## 🏆 Bonus Modules Implemented

### 1. Microsoft Entra ID (Azure AD SSO)
Integrated NextAuth.js with Azure Active Directory (Entra ID) to allow native enterprise SSO login, automatically mapping directory identities to database roles and departments.

### 2. Mock Microsoft Teams & Email Engine
Simulated Teams and Email notifications triggered upon sheet submissions, reviews, or cycle changes. Output logs structured in production-ready Adaptive Card formats directly visible in server telemetry.

### 3. Rule-Based SLA Escalation Engine
Automated cron-ready endpoint that scans the database for SLA breaches (e.g., goals awaiting approval for more than 7 days) and logs formal escalation records for HR intervention.

---

## 🗺️ System Architecture

![Atomberg Performance Portal Architecture](https://goal-quest-sable.vercel.app/architecture-diagram.png)

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router) + React (TypeScript)
- **Database ORM:** Prisma ORM
- **Database Engine:** Neon Serverless PostgreSQL
- **Authentication:** NextAuth.js (supporting Credentials & Azure AD SSO)
- **Styling & UI:** Tailwind CSS, shadcn/ui components, Lucide React icons
- **Data Visualization:** Recharts

---

## ⚙️ Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/De-Coder05/GoalQuest.git
cd GoalQuest
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="your-postgresql-url"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# SSO Configuration (Optional for local test login)
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
```

### 3. Run Database Migrations
```bash
npx prisma db push
```

### 4. Launch the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seed Accounts (Local Testing)
If not using SSO, you can log in using these seed credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin / HR** | admin@atomberg.com | password123 |
| **Manager** | manager@atomberg.com | password123 |
| **Employee** | employee@atomberg.com | password123 |

---

*Atomberg Performance Portal — Enterprise Objectives, Aligned.*
