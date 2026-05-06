# Enterprise CRM - Complete System Documentation

**Version:** 1.0.0  
**Last Updated:** March 28, 2026  
**Stack:** React 19 + TypeScript + Vite + Supabase (Auth + Database) + Tailwind CSS v4

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Getting Started](#4-getting-started)
5. [Core Features](#5-core-features)
6. [Module Documentation](#6-module-documentation)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Component Library](#9-component-library)
10. [Design System](#10-design-system)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Data Flow & State Management](#12-data-flow--state-management)
13. [Automation & Scheduled Jobs](#13-automation--scheduled-jobs)
14. [Utilities & Helpers](#14-utilities--helpers)
15. [Best Practices](#15-best-practices)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Overview

### 1.1 What is Enterprise CRM?

Enterprise CRM is a comprehensive Customer Relationship Management system built for modern businesses. It combines sales pipeline management, lead tracking, contact management, project management, inventory control, and procurement workflows into a single unified platform.

### 1.2 Key Capabilities

- **Sales Management:** Leads, Contacts, Deals, Quotes, Sales Orders
- **Project Management:** Projects, Tasks with subtasks, comments, time tracking
- **Inventory Management:** Stock tracking, low-stock alerts, inventory transactions
- **Procurement:** Purchase Requests, Purchase Orders, Vendor management
- **Activity Tracking:** Calls, emails, meetings, notes linked to records
- **Reporting:** Dashboard analytics, pipeline views, inventory reports
- **Automation:** Recurring tasks, quote expiration, stock reservations, follow-up reminders

### 1.3 Target Users

- Sales representatives and managers
- Project managers and team members
- Inventory and warehouse managers
- Procurement officers
- System administrators

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React SPA (Vite)                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │  Supabase   │  │   Wouter    │  │  TanStack Query │   │  │
│  │  │   Auth      │  │   Router    │  │  (State Cache)  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │           CRMContext (Global State)                 │  │  │
│  │  │    Leads | Contacts | Deals | Tasks | Inventory     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JWT + RLS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (Backend)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  PostgreSQL │  │   Auth RLS  │  │    Real-time Subs       │ │
│  │  Database   │  │   Policies  │  │    (Future Ready)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Auth (Supabase)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Sign In   │  │   Session   │  │   User Mgmt     │   │  │
│  │  │   Sign Up   │  │   Tokens    │  │   Invite Users  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
crm-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # App layout, Sidebar, Header
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── crmComponent/    # CRM-specific components
│   │   ├── logisticsComponent/  # Logistics components
│   │   ├── reusables/       # Shared form components
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── lib/                 # Core utilities and context
│   │   ├── CRMContext.tsx   # Global state management
│   │   ├── api.ts           # API client wrappers
│   │   ├── helpers.ts       # Utility functions
│   │   ├── types.ts         # TypeScript type definitions
│   │   ├── hooks.ts         # Custom React hooks
│   │   ├── supabaseClient.ts
│   │   ├── ThemeProvider.tsx
│   │   └── utils.ts
│   ├── pages/               # Page components
│   │   ├── core/            # Core CRM pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Contacts.tsx
│   │   │   ├── Deals.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Projects.tsx
│   │   │   └── Activities.tsx
│   │   ├── sales/           # Sales module pages
│   │   │   ├── Quotes.tsx
│   │   │   ├── SalesOrders.tsx
│   │   │   └── [Detail].tsx
│   │   ├── logistics/       # Logistics module pages
│   │   │   ├── Inventory.tsx
│   │   │   ├── PurchaseOrders.tsx
│   │   │   ├── PurchaseRequests.tsx
│   │   │   ├── Vendors.tsx
│   │   │   └── Reports.tsx
│   │   ├── settings/        # Admin settings
│   │   │   ├── Users.tsx
│   │   │   └── Roles.tsx
│   │   └── [Auth pages].tsx
│   ├── services/            # Business logic services
│   │   ├── scheduledJobs.ts
│   │   ├── quoteService.ts
│   │   ├── inventoryService.ts
│   │   └── types.ts
│   ├── assets/
│   ├── App.tsx              # Root component with routing
│   └── main.tsx             # Entry point
├── public/
├── .env.local               # Environment variables (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── [SQL migration files]
```

### 2.3 Data Flow

```
User Action → Component → useCRMResource → CRMContext → Supabase
                      ↓
              Optimistic Update
                      ↓
              UI Updates Immediately
                      ↓
              Background Sync to DB
                      ↓
              Toast Notification
```

---

## 3. Technology Stack

### 3.1 Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.4 | UI framework |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 8.0.0 | Build tool & dev server |

### 3.2 Routing & State

| Technology | Version | Purpose |
|------------|---------|---------|
| **Wouter** | 3.9.0 | Lightweight routing |
| **TanStack Query** | 5.91.2 | Server state caching |
| **TanStack Form** | 1.28.5 | Form management |

### 3.3 Authentication & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase Auth** | 2.100.0 | User authentication & session management |
| **Supabase** | 2.100.0 | PostgreSQL database with RLS |

### 3.4 UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.2.1 | Utility-first CSS |
| **shadcn/ui** | 4.1.0 | Component primitives |
| **Radix UI** | 1.4.3 | Accessible components |
| **Lucide React** | 0.577.0 | Icon library |
| **Sonner** | 2.0.7 | Toast notifications |

### 3.5 Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 4.3.6 | Schema validation |
| **date-fns** | 4.1.0 | Date manipulation |
| **Class Variance Authority** | 0.7.1 | Component variants |
| **clsx** | 2.1.1 | Conditional classes |
| **@dnd-kit** | 6.3.1 | Drag and drop |

---

## 4. Getting Started

### 4.1 Prerequisites

- **Node.js:** v18 or newer
- **pnpm:** v8+ (recommended) or npm
- **Supabase Account:** [supabase.com](https://supabase.com)

### 4.2 Environment Setup

Create a `.env.local` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Supabase service role key — ONLY for serverless functions and dev API.
# NEVER expose this in frontend code.
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (used in invitation email redirects)
APP_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173

# Optional: Backend API URL (if using separate API server)
VITE_API_URL=http://localhost:3001
```

### 4.3 Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

### 4.4 Database Setup

Run the SQL migration files in your Supabase SQL Editor in this order:

1. `supabase_tasks_enhanced.sql` - Task management tables
2. `supabase_projects.sql` - Projects table
3. `supabase_vendors.sql` - Vendors table
4. `supabase_inventory_transactions.sql` - Inventory transactions
5. `supabase_inventory_fix.sql` - Inventory fixes
6. `supabase_tasks_recurrence.sql` - Task recurrence
7. `supabase_tasks_enhanced.sql` - Additional task features

### 4.5 Supabase Auth Configuration

1. **Create Project:** Go to Supabase Dashboard → New Project
2. **Configure Auth:** Enable Email provider under Authentication → Providers
3. **Set Redirect URLs:**
   - Sign In: `http://localhost:5173/sign-in`
   - Sign Up: `http://localhost:5173/sign-up`
   - Dashboard: `http://localhost:5173/dashboard`
4. **Configure Site URL:** Authentication → URL Configuration → Site URL → `http://localhost:5173`
5. **Set up Invitation Emails:** Auth → Email Templates → Invite → Customize template
6. **Copy Keys:** Project Settings → API → Copy `URL` and `anon public` key to `.env.local`

---

## 5. Core Features

### 5.1 Lead Management

**Purpose:** Track and qualify potential customers

**Features:**
- Lead capture from multiple sources (website, referral, ads, import)
- Lead scoring algorithm (0-100) based on completeness and engagement
- Status workflow: New → Contacted → Qualified → Unqualified → Converted
- Lead conversion to Contact + Deal
- CSV export functionality

**Key Fields:**
```typescript
interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: LeadSource  // manual, referral, ad, import, website, cold-outreach, email
  status: LeadStatus  // new, contacted, qualified, unqualified, converted
  score: number       // 0-100
  ownerId: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### 5.2 Contact Management

**Purpose:** Manage customer relationships

**Features:**
- Contact profiles with company, email, phone
- Relationship scoring (Cold/Warm/Hot)
- Activity timeline (calls, emails, meetings, notes)
- Link to deals and opportunities
- Source tracking

**Relationship Score Calculation:**
```typescript
// Activity count: up to 40 points (8 pts per activity, max 5)
score += Math.min(activityCount * 8, 40)

// Recency: up to 40 points
if (days ≤ 1)   score += 40
if (days ≤ 3)   score += 35
if (days ≤ 7)   score += 25
if (days ≤ 14)  score += 15
if (days ≤ 30)  score += 5

// Active deals: 20 points
if (hasActiveDeals) score += 20
```

### 5.3 Deal Pipeline

**Purpose:** Track sales opportunities

**Features:**
- Visual pipeline by stage
- Deal health indicators (Green/Amber/Red)
- Expected close date tracking
- Lost reason capture
- Value tracking in USD

**Stages:**
```
Discovery → Proposal → Negotiation → Won/Lost
```

**Deal Health:**
| Days Since Activity | Health | Label |
|---------------------|--------|-------|
| < 7 | Green | Healthy |
| 7-14 | Amber | Needs attention |
| > 14 | Red | At risk |
| No activity | Red | At risk |

### 5.4 Task Management

**Purpose:** Track work items and activities

**Features:**
- **Priorities:** Low, Medium, High, Urgent
- **Status:** Open, In Progress, Completed
- **Recurrence:** Daily, Weekly, Monthly, Yearly, Custom
- **Subtasks:** Break down tasks into checklist items
- **Comments:** Team collaboration on tasks
- **Time Tracking:** Start/stop timer, manual entry
- **Activity Log:** Automatic audit trail
- **Tags:** Categorize tasks
- **Assignment:** Assign to multiple team members
- **Due Date Reminders:** Configurable notifications

**Task Structure:**
```typescript
interface Task {
  id: string
  title: string
  description?: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'completed'
  ownerId: string
  assignedTo?: string[]
  projectId?: string
  // Recurrence
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  recurrenceInterval?: number
  recurrenceEndDate?: string
  parentTaskId?: string
  nextOccurrence?: string
  // Enrichments
  subtasks?: TaskSubtask[]
  comments?: TaskComment[]
  activities?: TaskActivity[]
  tags?: string[]
  timeEntries?: TaskTimeEntry[]
  estimatedHours?: number
  trackedSeconds?: number
}
```

### 5.5 Project Management

**Purpose:** Organize work into projects

**Features:**
- Project creation with color coding
- Task association to projects
- Workload view for resource planning
- Project-level analytics

### 5.6 Quotes & Sales Orders

**Purpose:** Generate quotes and convert to orders

**Quotes Features:**
- Auto-generated quote numbers (QUOTE-YYYY-####)
- Line items with pricing
- Stock reservation capability
- Validity period tracking
- Follow-up reminders at 50% of validity window
- Auto-expiry and stock release
- Status: Draft → Sent → Accepted → Expired

**Sales Orders Features:**
- Auto-generated order numbers (ORDER-YYYY-####)
- Link to source quote
- Stock deduction on shipment
- Status: Pending → Shipped → Delivered → Cancelled
- Multi-item orders

### 5.7 Inventory Management

**Purpose:** Track stock levels and movements

**Features:**
- SKU-based tracking
- Category organization
- Stock level alerts (In Stock / Low Stock / Out of Stock)
- Reserved quantity tracking
- Automatic stock transactions audit trail
- Reorder threshold alerts
- Price management

**Stock Levels:**
```typescript
type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'
// Thresholds: low_stock ≤ 10, out_of_stock = 0
```

**Inventory Transactions:**
```typescript
type TransactionType = 'receipt' | 'shipment' | 'adjustment' | 'reservation' | 'release' | 'return'
type TransactionSource = 'purchase_order' | 'sales_order' | 'quote' | 'manual' | 'system'
```

### 5.8 Procurement

**Purpose:** Manage purchasing workflow

**Purchase Requests:**
- Employee-initiated requests
- Approval workflow
- Priority levels
- Department tracking
- Auto-generated request numbers

**Purchase Orders:**
- Vendor assignment
- Expected delivery dates
- Link to purchase requests
- Stock receipt tracking
- Auto-generated PO numbers

### 5.9 Vendor Management

**Purpose:** Track supplier relationships

**Features:**
- Vendor profiles with contact info
- Payment terms
- Category classification
- Status management (Active/Inactive/On Hold)
- Notes and history

### 5.10 Activity Tracking

**Purpose:** Log all customer interactions

**Activity Types:**
- **Call:** Phone conversations
- **Email:** Email correspondence
- **Meeting:** In-person or virtual meetings
- **Note:** General notes and observations

**Linking:** Activities can be linked to Leads, Contacts, or Deals

---

## 6. Module Documentation

### 6.1 Core Module (CRM)

**Pages:**
- `/dashboard` - Overview with metrics and widgets
- `/leads` - Lead list and management
- `/leads/:id` - Lead detail view
- `/contacts` - Contact list
- `/contacts/:id` - Contact detail with relationship score
- `/deals` - Pipeline view
- `/deals/:id` - Deal detail with health indicator
- `/tasks` - Task list with filters
- `/projects` - Project list
- `/projects/:id` - Project detail
- `/workload` - Resource allocation view
- `/activities` - Activity timeline

### 6.2 Sales Module

**Pages:**
- `/quotes` - Quote list
- `/quotes/:id` - Quote detail with line items
- `/orders` - Sales order list
- `/orders/:id` - Order detail with shipment tracking

### 6.3 Logistics Module

**Pages:**
- `/inventory` - Inventory list with stock levels
- `/inventory/:id` - Item detail with transaction history
- `/purchase-requests` - Purchase request list
- `/purchase-requests/:id` - Request detail
- `/purchase-orders` - Purchase order list
- `/purchase-orders/:id` - PO detail
- `/vendors` - Vendor directory
- `/reports` - Inventory and procurement reports

### 6.4 Settings Module

**Pages:**
- `/settings/users` - User management
- `/settings/roles` - Role and permission management

---

## 7. Database Schema

### 7.1 Core Tables

#### leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL,  -- manual, referral, ad, import, website, cold-outreach, email
  status TEXT NOT NULL,  -- new, contacted, qualified, unqualified, converted
  score INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL,
  notes TEXT,
  converted_at TIMESTAMPTZ,
  converted_to_contact_id UUID,
  converted_to_deal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL,  -- manual, referral, ad, import
  status TEXT,  -- lead, prospect, customer, churned
  owner_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### deals
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  value NUMERIC NOT NULL,
  stage TEXT NOT NULL,  -- discovery, proposal, negotiation, won, lost
  expected_close_date TIMESTAMPTZ,
  lost_reason TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  remind_at TIMESTAMPTZ,
  priority TEXT NOT NULL,  -- low, medium, high, urgent
  status TEXT NOT NULL,  -- open, in-progress, completed
  owner_id TEXT NOT NULL,
  assigned_to TEXT[],
  created_by TEXT NOT NULL,
  entity_type TEXT,  -- contact, deal, lead
  entity_id UUID,
  contact_id UUID,
  deal_id UUID,
  lead_id UUID,
  project_id UUID REFERENCES projects(id),
  completed_at TIMESTAMPTZ,
  recurrence_pattern TEXT,  -- daily, weekly, monthly, yearly, custom
  recurrence_interval INTEGER,
  recurrence_end_date TIMESTAMPTZ,
  parent_task_id UUID REFERENCES tasks(id),
  next_occurrence TIMESTAMPTZ,
  estimated_hours INTEGER,
  tracked_seconds INTEGER DEFAULT 0,
  subtasks JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### activities
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  lead_id UUID REFERENCES leads(id),
  type TEXT NOT NULL,  -- call, email, note, meeting
  content TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### 7.2 Task Enhancement Tables

#### task_tags
```sql
CREATE TABLE task_tags (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### task_tag_links
```sql
CREATE TABLE task_tag_links (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES task_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, tag_id)
);
```

#### task_subtasks
```sql
CREATE TABLE task_subtasks (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### task_comments
```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### task_activities
```sql
CREATE TABLE task_activities (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created', 'updated', 'completed', 'reopened', 'assigned', 'comment', 'attachment')),
  description TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### task_time_entries
```sql
CREATE TABLE task_time_entries (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Sales Tables

#### quotes
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,  -- draft, sent, accepted, expired
  date TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  items JSONB NOT NULL,
  terms TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  stock_reserved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### sales_orders
```sql
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES quotes(id),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,  -- pending, shipped, delivered, cancelled
  order_date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL,
  stock_deducted BOOLEAN DEFAULT false,
  stock_reserved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### 7.4 Inventory Tables

#### inventory
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  stock_level TEXT NOT NULL,  -- in_stock, low_stock, out_of_stock
  status TEXT NOT NULL,  -- active, draft
  image_url TEXT,
  reorder_threshold INTEGER,
  reorder_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### inventory_transactions
```sql
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory(id),
  inventory_item_name TEXT NOT NULL,
  type TEXT NOT NULL,  -- receipt, shipment, adjustment, reservation, release, return
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reserved_change INTEGER,
  reserved_before INTEGER,
  reserved_after INTEGER,
  reason TEXT,
  reference_type TEXT NOT NULL,  -- purchase_order, sales_order, quote, manual, system
  reference_id UUID,
  reference_number TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.5 Procurement Tables

#### vendors
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  category TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  status TEXT NOT NULL,  -- active, inactive, on_hold
  notes TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### purchase_requests
```sql
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,  -- draft, pending_review, approved, rejected, ordered
  date TIMESTAMPTZ NOT NULL,
  department TEXT NOT NULL,
  items JSONB NOT NULL,
  justification TEXT NOT NULL,
  urgent BOOLEAN DEFAULT false,
  purpose TEXT,
  priority TEXT NOT NULL,  -- low, medium, high, urgent
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

#### purchase_orders
```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,  -- draft, pending, sent, received, cancelled
  date TIMESTAMPTZ NOT NULL,
  expected_delivery TIMESTAMPTZ,
  items JSONB NOT NULL,
  reference_id UUID,  -- links to purchase_request
  shipping_info TEXT,
  internal_notes TEXT,
  vendor_instructions TEXT,
  stock_received BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

---

## 8. API Reference

### 8.1 Authentication

All API calls require authentication via Supabase JWT tokens. Tokens are automatically attached to requests by the `CRMContext`.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 8.2 CRMContext Methods

The application uses `CRMContext` for all data operations instead of direct API calls.

#### useCRMResource Hook

```typescript
const {
  data,           // Array of records
  isLoaded,       // Boolean loading state
  search,         // Current search term
  setSearch,      // Set search term
  addItems,       // async (items) => Promise
  updateItem,     // async (id, updates, silent?) => Promise
  deleteItem,     // async (id) => Promise
} = useCRMResource<ResourceType>('resource_name');
```

**Available Resources:**
- `leads`
- `contacts`
- `deals`
- `tasks`
- `activities`
- `projects`
- `orders` (sales orders)
- `quotes`
- `inventory`
- `purchase_orders`
- `purchase_requests`
- `inventory_transactions`
- `vendors`

#### Direct Context Methods

```typescript
const ctx = useCRMContext();

// Get resource data
const deals = ctx.getResource<Deal>('deals').data;

// Update resource directly
ctx.setResourceData('deals', (prev) => 
  prev.map(d => d.id === id ? { ...d, ...updates } : d)
);

// Run atomic operations
await ctx.runAtomicUpdate([
  { resource: 'quotes', action: 'update', id, patch: { status: 'accepted' } },
  { resource: 'inventory', action: 'update', id, patch: { stockQuantity: 5 } }
]);
```

### 8.3 Helper Functions

Import from `@/lib/helpers`:

#### ID Generation
```typescript
generateId(): string  // Returns UUID v4
```

#### Time Utilities
```typescript
relativeTime(dateString: string): string
// Returns: "just now", "2 minutes ago", "3 days ago", etc.

daysBetween(dateA: string, dateB: string): number
daysSince(dateString: string): number
```

#### Formatting
```typescript
formatCurrency(value: number): string
// Returns: "$1,235" (rounded to whole dollars)
```

#### Scoring
```typescript
calculateRelationshipScore(
  activityCount: number,
  lastActivityDate: string | null,
  hasActiveDeals: boolean
): number  // 0-100

getRelationshipLabel(score: number): 'Cold' | 'Warm' | 'Hot'

calculateLeadScore(lead: Lead): number  // 0-100

getDealHealth(lastActivityDate: string | null): 'green' | 'amber' | 'red'
```

#### Task Utilities
```typescript
isOverdue(task: Task): boolean
getTasksDueSoon(tasks: Task[], days: number): Task[]
priorityWeight(priority: string): number  // 1-4
sortTasks(tasks: Task[]): Task[]
```

#### Export
```typescript
exportToCSV<T>(
  data: T[],
  columns: Array<{ key: string; header: string }>,
  filename: string
): void  // Triggers browser download
```

#### Debounce
```typescript
debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

---

## 9. Component Library

### 9.1 UI Components (shadcn/ui)

Located in `src/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | Primary, outline, ghost variants |
| Input | `input.tsx` | Text input with validation |
| Textarea | `textarea.tsx` | Multi-line text input |
| Card | `card.tsx` | Card container with header/content |
| Badge | `badge.tsx` | Status badges |
| Dialog | `dialog.tsx` | Modal dialogs |
| Popover | `popover.tsx` | Popover menus |
| Calendar | `calendar.tsx` | Date picker calendar |
| Date Picker | `date-picker.tsx` | Combined date input |
| Sheet | `sheet.tsx` | Slide-out panels |
| Pagination | `Pagination.tsx` | List pagination |
| Confirm Modal | `confirm-modal.tsx` | Confirmation dialogs |
| Delete Modal | `delete-modal.tsx` | Delete confirmations |
| Stock Adjustment | `stock-adjustment-modal.tsx` | Inventory adjustments |
| Page Skeleton | `page-skeleton.tsx` | Loading states |
| Label | `label.tsx` | Form labels |

### 9.2 Layout Components

#### AppLayout
```typescript
<AppLayout>
  {children}
</AppLayout>
```
- Sidebar navigation (collapsible)
- Header with user menu
- Mobile-responsive with hamburger menu
- Theme toggle support

#### Sidebar
- Navigation groups: Core, Sales, Logistics, Settings
- Active route highlighting
- Collapsible state (persisted in localStorage)
- Mobile drawer variant

#### Navbar
- Public-facing header
- Sign in/out links
- Theme toggle
- Logo and branding

### 9.3 CRM Components

Located in `src/components/cmComponent/` and `src/components/logisticsComponent/`:

**Sales Components:**
- `QuoteForm.tsx` - Create/edit quotes
- `QuoteItemEditor.tsx` - Line item management
- `SalesOrderForm.tsx` - Create/edit orders
- `OrderItemEditor.tsx` - Order line items

**Logistics Components:**
- `InventoryForm.tsx` - Add/edit inventory items
- `StockLevelIndicator.tsx` - Visual stock status
- `PurchaseOrderForm.tsx` - PO creation
- `PurchaseRequestForm.tsx` - PR creation
- `VendorForm.tsx` - Vendor management

**Task Components:**
- `TaskForm.tsx` - Task creation/editing
- `SubtaskList.tsx` - Subtask checklist
- `TaskComments.tsx` - Comment thread
- `TimeTracker.tsx` - Time entry widget
- `TagSelector.tsx` - Tag assignment

---

## 10. Design System

### 10.1 Color Palette

**Base Colors:**
```css
/* Light Mode */
--bg-base: #f8fafc;        /* slate-50 */
--bg-surface: #ffffff;     /* white */
--text-primary: #0f172a;   /* slate-900 */
--text-secondary: #64748b; /* slate-500 */
--border: #e2e8f0;         /* slate-200 */

/* Dark Mode */
--bg-base: #020617;        /* slate-950 */
--bg-surface: #0f172a;     /* slate-900 */
--text-primary: #f8fafc;   /* slate-50 */
--text-secondary: #94a3b8; /* slate-400 */
--border: #1e293b;         /* slate-800 */
```

**Accent Color (Indigo):**
```css
--accent: #4f46e5;         /* indigo-600 */
--accent-hover: #4338ca;   /* indigo-700 */
--accent-light: #e0e7ff;   /* indigo-100 */
```

**Status Colors:**
| Status | Background | Text |
|--------|-----------|------|
| Success | `bg-green-500` | `text-green-700` |
| Warning | `bg-amber-500` | `text-amber-700` |
| Error | `bg-red-500` | `text-red-700` |
| Info | `bg-blue-500` | `text-blue-700` |

### 10.2 Typography

**Font Family:**
```css
font-family: 'Geist Variable', sans-serif;
```

**Type Scale:**
| Element | Class | Size | Weight |
|---------|-------|------|--------|
| Page Title | `text-3xl` | 30px | bold |
| Section Header | `text-lg` | 18px | bold |
| Body | `text-sm` | 14px | medium |
| Small/Meta | `text-xs` | 12px | medium |
| Table Header | `text-[10px]` | 10px | bold, uppercase |

### 10.3 Spacing

**Base Scale:** 4px grid
- `p-1` = 4px
- `p-2` = 8px
- `p-3` = 12px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

### 10.4 Border Radius

| Component | Radius | Class |
|-----------|--------|-------|
| Cards | 2rem | `rounded-[2rem]` |
| Search/Tabs | 1.5rem | `rounded-2xl` |
| Buttons/Inputs | 0.75rem | `rounded-xl` |
| Badges | 0.5rem | `rounded-lg` |
| Avatars | Full | `rounded-full` |

### 10.5 Shadows

**Elevation Scale:**
```css
/* Light shadows for cards */
shadow-sm shadow-slate-200/50

/* Primary button shadow */
shadow-lg shadow-indigo-200

/* No shadow in dark mode */
dark:shadow-none
```

### 10.6 Component Patterns

#### Page Wrapper
```tsx
<div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
  <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">
    {content}
  </div>
</div>
```

#### Page Header
```tsx
<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
      Page Title
    </h1>
    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
      Subtitle here.
    </p>
  </div>
  <div className="flex items-center gap-3">
    {/* Action buttons */}
  </div>
</div>
```

#### Cards
```tsx
<div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
  {content}
</div>
```

#### Buttons
```tsx
/* Primary */
<button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-5 shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-xs uppercase tracking-wider">
  Label
</button>

/* Outline */
<button className="rounded-xl border border-slate-200 dark:border-slate-800 h-11 px-5 font-bold text-xs uppercase tracking-wider">
  Label
</button>
```

#### Status Badges
```tsx
<span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
  New
</span>
```

---

## 11. Authentication & Authorization

### 11.1 Supabase Auth Integration

**Setup:**
1. User visits app → Supabase checks for existing session
2. No session → Redirect to `/sign-in` or `/sign-up`
3. Successful auth → Supabase issues JWT
4. App receives token via `useAuth()` → Token passed to Supabase client
5. Supabase RLS policies enforce access control

**Token Flow:**
```
User Login
    ↓
Supabase Issues JWT
    ↓
App receives token via useAuth()
    ↓
Token passed to Supabase client & API layer
    ↓
Supabase RLS policies enforce access
```

### 11.2 Role-Based Access Control

User roles are managed through the `app_users` and `roles` tables:

```typescript
const { userId } = useAuth();

// Fetch user role
const { data } = await supabase
  .from('app_users')
  .select('roles(name)')
  .eq('auth_user_id', userId)
  .maybeSingle();
```

**Data Isolation:**
- All records include `owner_id` (Supabase user ID)
- RLS policies filter by `auth.uid()`
- Role-based UI gating via `app_users.role_id` → `roles` relationship

### 11.3 Protected Routes

```tsx
<ProtectedRoute component={Dashboard} />
```

**Implementation:**
```typescript
// components/ProtectedRoute.tsx
export function ProtectedRoute({ component: Component }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" />;
  
  return <Component />;
}
```

### 11.4 Role-Based Access Control (RBAC)

**Roles System:**
- Admin, Manager, Member, Viewer
- Custom roles with granular permissions
- Permission modules: users, roles, leads, contacts, deals, tasks, inventory, orders, quotes

**Permission Structure:**
```typescript
interface Permission {
  id: string;
  module: string;  // 'users', 'leads', 'deals', etc.
  action: string;  // 'create', 'read', 'update', 'delete'
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}
```

**Future Enhancement:**
- Integrate permissions into UI component rendering
- API-level permission checks
- Audit logging for sensitive operations

---

## 12. Data Flow & State Management

### 12.1 CRMContext Architecture

**Single Source of Truth:**
```typescript
interface CRMContextValue {
  userId: string;
  getResource: <T>(name: string) => ResourceState<T>;
  setResourceData: <T>(name: string, updater: (prev: T[]) => T[]) => void;
  getClient: () => Promise<SupabaseClient | null>;
  runAtomicUpdate: (ops: AtomicOp[]) => Promise<AtomicOp[]>;
}
```

**State Shape:**
```typescript
interface ResourceState<T> {
  data: T[];
  isLoaded: boolean;
}

// Store structure
{
  leads: { data: [...], isLoaded: true },
  contacts: { data: [...], isLoaded: true },
  deals: { data: [...], isLoaded: true },
  // ...
}
```

### 12.2 Data Loading Strategy

**Preloading:**
```typescript
const PRELOAD_RESOURCES = [
  "leads", "contacts", "deals", "tasks", "activities", "projects"
];

// In CRMProvider
useEffect(() => {
  if (!userLoaded || !userId || !session) return;
  PRELOAD_RESOURCES.forEach((r) => fetchResource(r));
}, [userLoaded, userId, session]);
```

**Lazy Loading:**
- Secondary resources (inventory, orders, quotes) load on-demand
- `getResource()` triggers fetch if not already loaded
- Prevents duplicate fetches with `fetchedRef`

### 12.3 Optimistic Updates

**Pattern:**
```typescript
// 1. Update UI immediately
ctx.setResourceData('deals', (prev) =>
  prev.map(d => d.id === id ? { ...d, ...updates } : d)
);

// 2. Persist to database
const promise = updateRow(ctx, 'deals', id, updates);

// 3. Show toast
toast.promise(promise, {
  loading: 'Updating...',
  success: 'Updated successfully',
  error: 'Update failed'
});
```

**Benefits:**
- Instant UI feedback
- Better perceived performance
- Automatic rollback on error (future enhancement)

### 12.4 Atomic Operations

For operations affecting multiple resources:

```typescript
await ctx.runAtomicUpdate([
  {
    resource: 'quotes',
    action: 'update',
    id: quoteId,
    patch: { status: 'accepted', stockReserved: false }
  },
  {
    resource: 'inventory',
    action: 'update',
    id: itemId,
    patch: { 
      stockQuantity: currentStock - quantity,
      reservedQuantity: currentReserved - quantity
    }
  }
]);
```

**Guarantees:**
1. All DB operations succeed OR all fail
2. React state only updates on full success
3. Error thrown if any operation fails

### 12.5 Case Conversion

Automatic snake_case ↔ camelCase conversion:

```typescript
// Client-side (camelCase)
const contact = { firstName: "John", lastName: "Doe" };

// Database (snake_case)
const row = toSnake(contact);
// { first_name: "John", last_name: "Doe" }

// Query result → Client
const result = toCamel(row);
// { firstName: "John", lastName: "Doe" }
```

**Special Handling:**
- UUID fields cleared if empty string (prevents DB errors)
- Nested objects recursively converted
- Arrays handled correctly

---

## 13. Automation & Scheduled Jobs

### 13.1 Overview

The system runs automated background jobs to handle time-sensitive operations. Jobs run on app load and periodically thereafter.

**Location:** `src/services/scheduledJobs.ts`

### 13.2 Job Types

#### 1. Recurring Task Processing

**Purpose:** Create next occurrence when recurring task is completed

**Logic:**
```typescript
processRecurringTasks(ctx):
  For each task with recurrencePattern:
    If task.status === 'completed' AND completed:
      Check if past nextOccurrence date
      Check if within recurrenceEndDate
      Create new task instance
      Update nextOccurrence for parent
```

**Recurrence Patterns:**
- `daily` - Every N days
- `weekly` - Every N weeks
- `monthly` - Every N months
- `yearly` - Every N years
- `custom` - Every N days (custom interval)

#### 2. Quote Expiration

**Purpose:** Auto-expire quotes and release reserved stock

**Logic:**
```typescript
autoExpireQuotes(ctx):
  For each quote with status === 'sent':
    If now > validUntil AND stockReserved === true:
      Call releaseQuoteStock()
      Update quote.status = 'expired'
      Update quote.stockReserved = false
```

**Stock Release:**
- Decrements `reservedQuantity`
- Creates `inventory_transaction` (type: 'release')
- Reference: quote ID and number

#### 3. Follow-Up Reminders

**Purpose:** Send reminders at midpoint of quote validity

**Logic:**
```typescript
sendFollowUpReminders(adapter):
  For each quote with status === 'sent':
    Calculate midpoint = createdAt + (validUntil - createdAt) / 2
    If now >= midpoint AND now < validUntil AND !reminderSent:
      Send toast notification
      Update quote.reminderSent = true
```

**User Experience:**
- Non-intrusive toast notification
- "Follow up on Quote #QUOTE-2026-0042"
- Links to quote detail page

#### 4. Low Stock Alerts

**Purpose:** Alert when inventory falls below threshold

**Logic:**
```typescript
checkAndAlertLowStock(adapter, ctx):
  For each inventory item:
    If stockQuantity <= reorderThreshold:
      Create toast alert
      Optionally: Auto-create purchase request
```

**Thresholds:**
- `low_stock`: stockQuantity ≤ 10
- `out_of_stock`: stockQuantity = 0
- Custom: `reorderThreshold` per item

### 13.3 Job Execution

**Orchestration:**
```typescript
export async function runScheduledJobs(adapter, ctx) {
  console.log("[scheduledJobs] Starting automation checks...");
  await processRecurringTasks(ctx);
  await autoExpireQuotes(ctx);
  await sendFollowUpReminders(adapter);
  await checkAndAlertLowStock(adapter, ctx);
  console.log("[scheduledJobs] Automation checks complete.");
}
```

**Trigger Points:**
1. App initialization (after data loaded)
2. Future: Scheduled intervals (every 5 minutes)
3. Future: Web hooks / server-side cron

**Job Adapter Pattern:**
```typescript
interface JobAdapter {
  getQuotes: () => Quote[];
  updateQuote: (id, patch) => Promise<void>;
  getInventoryItems: () => InventoryItem[];
  updateInventoryItem: (id, patch) => Promise<void>;
  // ...
}
```

**Benefits:**
- Decouples jobs from React context
- Makes services testable
- Enables server-side migration

---

## 14. Utilities & Helpers

### 14.1 File: `src/lib/helpers.ts`

Complete reference for utility functions.

### 14.2 ID Generation

```typescript
generateId(): string
```

**Implementation:**
```typescript
export function generateId(): string {
  return crypto.randomUUID();
}
```

**Usage:**
```typescript
const newId = generateId();
// "550e8400-e29b-41d4-a716-446655440000"
```

### 14.3 Time Utilities

#### relativeTime
```typescript
relativeTime(dateString: string): string
```

**Examples:**
| Input | Output |
|-------|--------|
| 30 seconds ago | `"just now"` |
| 2 minutes ago | `"2 minutes ago"` |
| 1 hour ago | `"1 hour ago"` |
| 3 days ago | `"3 days ago"` |
| 2 weeks ago | `"2 weeks ago"` |
| 3 months ago | `"3 months ago"` |

#### daysBetween
```typescript
daysBetween(dateA: string, dateB: string): number
```

**Example:**
```typescript
daysBetween("2024-01-01", "2024-01-15"); // 14
```

#### daysSince
```typescript
daysSince(dateString: string): number
```

**Example:**
```typescript
daysSince("2024-01-01"); // 87 (if today is March 28, 2024)
```

### 14.4 Currency Formatting

```typescript
formatCurrency(value: number): string
```

**Examples:**
```typescript
formatCurrency(1234.56);  // "$1,235"
formatCurrency(500);      // "$500"
formatCurrency(99.99);    // "$100"
```

**Note:** Rounds to whole dollars (no cents)

### 14.5 Relationship Scoring

#### calculateRelationshipScore
```typescript
calculateRelationshipScore(
  activityCount: number,
  lastActivityDate: string | null,
  hasActiveDeals: boolean
): number
```

**Algorithm:**
```typescript
let score = 0;

// Activity: up to 40 points (8 per activity, max 5)
score += Math.min(activityCount * 8, 40);

// Recency: up to 40 points
const days = daysSince(lastActivityDate);
if (days <= 1) score += 40;
else if (days <= 3) score += 35;
else if (days <= 7) score += 25;
else if (days <= 14) score += 15;
else if (days <= 30) score += 5;

// Active deals: 20 points
if (hasActiveDeals) score += 20;

return Math.min(score, 100);
```

#### getRelationshipLabel
```typescript
getRelationshipLabel(score: number): 'Cold' | 'Warm' | 'Hot'
```

**Thresholds:**
| Score | Label |
|-------|-------|
| ≥ 66 | Hot |
| 33-65 | Warm |
| 0-32 | Cold |

### 14.6 Lead Scoring

```typescript
calculateLeadScore(lead: Lead): number
```

**Algorithm:**
```typescript
let score = 0;

// Field completeness (max 45)
if (lead.email) score += 20;
if (lead.phone) score += 10;
if (lead.company) score += 15;

// Source bonus
switch (lead.source) {
  case 'referral': score += 20; break;
  case 'website': score += 15; break;
  case 'ad': score += 10; break;
  default: score += 5;
}

// Status bonus
switch (lead.status) {
  case 'converted': score += 30; break;
  case 'qualified': score += 20; break;
  case 'contacted': score += 10; break;
  case 'unqualified': score -= 10; break;
}

return Math.min(Math.max(score, 0), 100);
```

### 14.7 Deal Health

```typescript
getDealHealth(lastActivityDate: string | null): 'green' | 'amber' | 'red'
```

**Logic:**
| Days Since Activity | Health |
|---------------------|--------|
| No activity | Red |
| > 14 | Red |
| 7-14 | Amber |
| < 7 | Green |

### 14.8 Task Utilities

#### isOverdue
```typescript
isOverdue(task: Task): boolean
```

**Logic:**
```typescript
if (task.status === 'completed') return false;
return new Date(task.dueDate) < today;
```

#### getTasksDueSoon
```typescript
getTasksDueSoon(tasks: Task[], days: number): Task[]
```

**Returns:** Tasks due within N days (excluding completed)

#### priorityWeight
```typescript
priorityWeight(priority: string): number
```

**Mapping:**
| Priority | Weight |
|----------|--------|
| urgent | 4 |
| high | 3 |
| medium | 2 |
| low | 1 |

#### sortTasks
```typescript
sortTasks(tasks: Task[]): Task[]
```

**Sort Order:**
1. Incomplete before completed
2. Overdue first
3. By priority (urgent → low)
4. By due date (earliest first)
5. Completed by completion date (recent first)

### 14.9 CSV Export

```typescript
exportToCSV<T>(
  data: T[],
  columns: Array<{ key: string; header: string }>,
  filename: string
): void
```

**Example:**
```typescript
exportToCSV(
  leads,
  [
    { key: 'name', header: 'Lead Name' },
    { key: 'email', header: 'Email' },
    { key: 'company', header: 'Company' },
    { key: 'status', header: 'Status' },
  ],
  'leads'
);
// Downloads: leads_2024-03-28.csv
```

**CSV Format:**
- UTF-8 encoded
- Proper quote escaping
- Unix line endings
- Date-stamped filename

### 14.10 Debounce

```typescript
debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

**Usage:**
```typescript
const debouncedSearch = useCallback(
  debounce((value: string) => setSearch(value), 300),
  [setSearch]
);

useEffect(() => {
  debouncedSearch(searchInput);
}, [searchInput, debouncedSearch]);
```

**Use Case:** Search inputs (300ms delay)

---

## 15. Best Practices

### 15.1 Code Organization

**File Structure:**
- One component per file
- Co-locate related files (component + styles + tests)
- Use index.ts for clean exports

**Naming Conventions:**
```typescript
// Components: PascalCase
Dashboard.tsx, TaskForm.tsx

// Utilities: camelCase
helpers.ts, utils.ts

// Types: PascalCase with interface
interface Lead { ... }

// Constants: UPPER_SNAKE_CASE
const MAX_PAGE_SIZE = 100;
```

### 15.2 TypeScript Usage

**Always Type:**
```typescript
// ✅ Good
interface Props {
  userId: string;
  onSave: (data: Lead) => void;
}

// ❌ Avoid
const Component = (props: any) => { ... }
```

**Use Utility Types:**
```typescript
type CreateLeadInput = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;
type PartialContact = Partial<Contact>;
```

### 15.3 React Patterns

**Custom Hooks:**
```typescript
// Extract logic
function useLeadConversion(leadId: string) {
  const [converting, setConverting] = useState(false);
  
  const convert = useCallback(async (data) => {
    // ...
  }, [leadId]);
  
  return { converting, convert };
}
```

**Memoization:**
```typescript
// Expensive calculations
const scoredLeads = useMemo(() => 
  leads.map(lead => ({ ...lead, score: calculateLeadScore(lead) })),
  [leads]
);

// Event handlers
const handleSubmit = useCallback(async (data) => {
  // ...
}, [dependencies]);
```

### 15.4 Performance

**Avoid:**
- Unnecessary re-renders (use React.memo)
- Large inline objects in JSX
- Fetching data on every render

**Prefer:**
- CRMContext for shared state
- Optimistic updates
- Debounced search inputs
- Lazy loading for non-critical resources

### 15.5 Error Handling

**Toast Notifications:**
```typescript
toast.promise(promise, {
  loading: 'Saving...',
  success: 'Saved successfully',
  error: (err) => `Failed: ${err.message}`
});
```

**Try-Catch:**
```typescript
try {
  await apiCall();
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Something went wrong');
}
```

### 15.6 Security

**Never:**
- Commit `.env.local` to git
- Hardcode API keys
- Log sensitive data (tokens, passwords)
- Trust user input without validation

**Always:**
- Use environment variables
- Validate with Zod schemas
- Sanitize HTML content
- Follow RLS policies

### 15.7 Testing

**Unit Tests:**
```typescript
describe('calculateLeadScore', () => {
  it('should score complete referral lead high', () => {
    const lead: Lead = {
      email: 'test@example.com',
      phone: '123',
      company: 'Acme',
      source: 'referral',
      status: 'qualified'
    };
    expect(calculateLeadScore(lead)).toBe(85);
  });
});
```

**Integration Tests:**
- Test full user workflows
- Mock API responses
- Verify UI state changes

---

## 16. Troubleshooting

### 16.1 Common Issues

#### "Missing Publishable Key"

**Error:**
```
Error: Missing Supabase anon key. Please set VITE_SUPABASE_ANON_KEY in .env.local
```

**Solution:**
1. Check `.env.local` exists in project root
2. Verify key format: `VITE_SUPABASE_ANON_KEY=eyJ...`
3. Verify `VITE_SUPABASE_URL` is set correctly
4. Restart dev server after changes
5. Clear browser cache

#### "Not Authenticated"

**Error:**
```
Error: Not authenticated
```

**Causes:**
- Supabase session expired
- Token refresh failed
- Invalid credentials

**Solution:**
1. Sign out and sign back in
2. Check Supabase Dashboard → Authentication → Users
3. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

#### "Failed to fetch resource"

**Error:**
```
[CRMContext] Failed to fetch leads: ...
```

**Causes:**
- Supabase credentials missing
- RLS policy blocking access
- Network error

**Solution:**
1. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify RLS policies in Supabase
3. Check browser console for details
4. Test Supabase connection directly

#### "Atomic update failed"

**Error:**
```
Atomic update failed with 1 errors. Local state not committed.
```

**Causes:**
- Database constraint violation
- Foreign key reference missing
- Permission denied

**Solution:**
1. Check error details in console
2. Verify all referenced IDs exist
3. Check user permissions
4. Review database constraints

### 16.2 Debugging Tips

**Enable Logging:**
```typescript
// In CRMContext.tsx
console.log('[CRMContext] Fetching:', name, tableName);
console.log('[CRMContext] Result:', rows);
```

**Check Auth State:**
```typescript
const { isSignedIn, user, session } = useAuth();
console.log('Auth state:', { isSignedIn, user, session });
```

**Inspect Context:**
```typescript
const ctx = useCRMContext();
console.log('Context state:', ctx);
```

### 16.3 Performance Issues

**Slow Page Loads:**
1. Check network tab for slow queries
2. Verify database indexes
3. Reduce preloaded resources
4. Implement pagination

**Memory Leaks:**
1. Check for missing cleanup in useEffect
2. Clear intervals and timeouts
3. Remove event listeners
4. Use React DevTools Profiler

### 16.4 Getting Help

**Resources:**
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Tailwind Docs:** https://tailwindcss.com/docs

**Debug Tools:**
- React DevTools (component tree)
- Redux DevTools (state inspection)
- Network tab (API calls)
- Supabase Studio (database)

---

## Appendix A: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server only) | Service role key — NEVER expose in frontend |
| `APP_URL` | ✅ | App URL for invitation email redirects |
| `VITE_APP_URL` | ✅ | App URL for frontend |
| `VITE_API_URL` | ❌ | Backend API URL (if used) |

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Global search (future) |
| `Ctrl/Cmd + N` | New record (context-dependent) |
| `Esc` | Close modal/dropdown |
| `?` | Show shortcuts (future) |

## Appendix C: File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `TaskForm.tsx` |
| Utilities | camelCase.ts | `helpers.ts` |
| Types | types.ts or PascalCase.ts | `types.ts` |
| Styles | module.css or in TSX | (Tailwind in TSX) |
| Tests | *.test.ts | `helpers.test.ts` |

## Appendix D: Git Workflow

```bash
# Feature branch
git checkout -b feature/feature-name

# Commit messages
feat: Add task recurrence
fix: Fix quote expiration bug
docs: Update README
style: Format code
refactor: Refactor CRMContext
test: Add unit tests
chore: Update dependencies
```

---

**End of Documentation**

*For questions or issues, please contact the development team.*
