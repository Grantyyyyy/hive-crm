# Helpers Utility Documentation

**File**: `src/lib/helpers.ts`

Central utility functions for the CRM application, providing common operations for date manipulation, scoring algorithms, data formatting, and export functionality.

---

## 📋 Table of Contents

- [ID Generation](#-id-generation)
- [Time Utilities](#-time-utilities)
- [Currency Formatting](#-currency-formatting)
- [Relationship Scoring](#-relationship-scoring)
- [Deal Health](#-deal-health)
- [Lead Scoring](#-lead-scoring)
- [Task Management](#-task-management)
- [CSV Export](#-csv-export)
- [Debounce](#-debounce)

---

## 🔑 ID Generation

### `generateId()`

Generates a unique identifier using the Web Crypto API.

```typescript
export function generateId(): string
```

**Returns**: `string` - A UUID v4 string

**Example**:
```typescript
const id = generateId(); // "550e8400-e29b-41d4-a716-446655440000"
```

**Used in**: All form components when creating new records

---

## ⏰ Time Utilities

### `relativeTime(dateString)`

Converts a date string to a human-readable relative time format.

```typescript
export function relativeTime(dateString: string): string
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `dateString` | `string` | ISO 8601 date string |

**Returns**: `string` - Relative time description

**Output Examples**:
| Input | Output |
|-------|--------|
| 30 seconds ago | `"just now"` |
| 2 minutes ago | `"2 minutes ago"` |
| 5 hours ago | `"5 hours ago"` |
| 3 days ago | `"3 days ago"` |
| 2 weeks ago | `"2 weeks ago"` |
| 3 months ago | `"3 months ago"` |

**Used in**: Activity timelines, task due dates, record creation timestamps

---

### `daysBetween(dateA, dateB)`

Calculates the absolute number of days between two dates.

```typescript
export function daysBetween(dateA: string, dateB: string): number
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `dateA` | `string` | First ISO 8601 date string |
| `dateB` | `string` | Second ISO 8601 date string |

**Returns**: `number` - Absolute days between dates

**Example**:
```typescript
const days = daysBetween("2024-01-01", "2024-01-15"); // 14
```

---

### `daysSince(dateString)`

Calculates the number of days from a given date to now.

```typescript
export function daysSince(dateString: string): number
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `dateString` | `string` | ISO 8601 date string |

**Returns**: `number` - Days since the given date

**Example**:
```typescript
const days = daysSince("2024-01-01"); // 87 (if today is March 28, 2024)
```

**Used in**: Contact follow-up alerts, deal health calculation

---

## 💰 Currency Formatting

### `formatCurrency(value)`

Formats a number as USD currency.

```typescript
export function formatCurrency(value: number): string
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | Numeric value to format |

**Returns**: `string` - Formatted currency string

**Example**:
```typescript
formatCurrency(1234.56);  // "$1,235"
formatCurrency(500);      // "$500"
formatCurrency(99.99);    // "$100"
```

**Note**: Rounds to whole dollars (no cents displayed)

**Used in**: Deal values, order totals, quote amounts, inventory prices

---

## 💕 Relationship Scoring

### `calculateRelationshipScore(activityCount, lastActivityDate, hasActiveDeals)`

Calculates a relationship strength score (0-100) for a contact.

```typescript
export function calculateRelationshipScore(
  activityCount: number,
  lastActivityDate: string | null,
  hasActiveDeals: boolean
): number
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `activityCount` | `number` | Total number of activities |
| `lastActivityDate` | `string \| null` | ISO date of last activity |
| `hasActiveDeals` | `boolean` | Whether contact has active deals |

**Returns**: `number` - Score from 0 to 100

**Scoring Algorithm**:
```typescript
// Activity count: up to 40 points (8 points per activity, max 5 activities)
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

**Example**:
```typescript
// Contact with 5 activities, last one 2 days ago, has active deal
calculateRelationshipScore(5, "2024-03-26", true); // 40 + 40 + 20 = 100

// Contact with 2 activities, last one 10 days ago, no active deals
calculateRelationshipScore(2, "2024-03-18", false); // 16 + 15 + 0 = 31
```

**Used in**: Contacts list view, ContactDetail page

---

### `getRelationshipLabel(score)`

Converts a relationship score to a human-readable label.

```typescript
export function getRelationshipLabel(score: number): RelationshipLabel
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `score` | `number` | Relationship score (0-100) |

**Returns**: `RelationshipLabel` - `"Cold"` | `"Warm"` | `"Hot"`

**Thresholds**:
| Score Range | Label |
|-------------|-------|
| ≥ 66 | `"Hot"` |
| 33 - 65 | `"Warm"` |
| 0 - 32 | `"Cold"` |

**Used in**: Contacts list view, ContactDetail header

---

### `getRelationshipColor(label)` / `getRelationshipTextColor(label)`

Returns color classes for relationship labels.

```typescript
export function getRelationshipColor(label: RelationshipLabel): string
export function getRelationshipTextColor(label: RelationshipLabel): string
```

**Color Mapping**:
| Label | Background Color | Text Color |
|-------|-----------------|------------|
| Hot | `bg-red-500` | `text-red-600` |
| Warm | `bg-amber-500` | `text-amber-600` |
| Cold | `bg-blue-400` | `text-blue-500` |

---

## 📊 Deal Health

### `getDealHealth(lastActivityDate)`

Determines deal health status based on last activity date.

```typescript
export function getDealHealth(lastActivityDate: string | null): DealHealth
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `lastActivityDate` | `string \| null` | ISO date of last activity |

**Returns**: `DealHealth` - `"green"` | `"amber"` | `"red"`

**Health Criteria**:
| Days Since Activity | Health |
|---------------------|--------|
| No activity | `"red"` |
| > 14 days | `"red"` |
| 7 - 14 days | `"amber"` |
| < 7 days | `"green"` |

**Used in**: Deal pipeline view, DealDetail page

---

### `getDealHealthColor(health)` / `getDealHealthLabel(health)`

Returns color classes and descriptions for deal health.

```typescript
export function getDealHealthColor(health: DealHealth): string
export function getDealHealthLabel(health: DealHealth): string
```

**Health Display**:
| Health | Color | Label |
|--------|-------|-------|
| green | `bg-green-500` | `"Healthy — recent activity"` |
| amber | `bg-amber-500` | `"Needs attention — 7-14 days since last activity"` |
| red | `bg-red-500` | `"At risk — over 14 days since last activity"` |

---

## 🎯 Lead Scoring

### `calculateLeadScore(lead)`

Calculates a lead quality score (0-100) based on completeness and engagement.

```typescript
export function calculateLeadScore(lead: Lead): number
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `lead` | `Lead` | Lead object with all fields |

**Returns**: `number` - Score from 0 to 100

**Scoring Algorithm**:

```typescript
// Field Completeness (max 45 points)
if (lead.email)   score += 20
if (lead.phone)   score += 10
if (lead.company) score += 15

// Source Bonus
referral:        +20
website:         +15
ad:              +10
cold-outreach:   +5
manual:          +5
import:          +5

// Status Bonus
contacted:       +10
qualified:       +20
unqualified:     -10
converted:       +30
```

**Example**:
```typescript
const lead: Lead = {
  name: "John Doe",
  email: "john@example.com",      // +20
  phone: "+1234567890",           // +10
  company: "Acme Inc",            // +15
  source: "referral",             // +20
  status: "qualified",            // +20
  score: 0
};

calculateLeadScore(lead); // 85
```

**Used in**: LeadForm (on save), Leads list view, LeadDetail page

---

## ✅ Task Management

### `isOverdue(task)`

Checks if a task is past its due date.

```typescript
export function isOverdue(task: Task): boolean
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `task` | `Task` | Task object |

**Returns**: `boolean` - `true` if task is overdue and not completed

**Logic**:
```typescript
if (task.status === 'completed') return false
return task.dueDate < today (at midnight)
```

**Used in**: Task lists, task detail view, task sorting

---

### `getTasksDueSoon(tasks, days)`

Filters tasks that are due within a specified number of days.

```typescript
export function getTasksDueSoon(tasks: Task[], days: number): Task[]
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `tasks` | `Task[]` | Array of tasks |
| `days` | `number` | Number of days to look ahead |

**Returns**: `Task[]` - Tasks due within the specified period (excluding completed)

**Used in**: Dashboard widgets, task reminders

---

### `priorityWeight(priority)`

Converts task priority to numeric weight for sorting.

```typescript
export function priorityWeight(priority: Task['priority']): number
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `priority` | `Task['priority']` | Priority string |

**Returns**: `number` - Weight value

**Mapping**:
| Priority | Weight |
|----------|--------|
| urgent | 4 |
| high | 3 |
| medium | 2 |
| low | 1 |

---

### `sortTasks(tasks)`

Sorts tasks by priority and due date.

```typescript
export function sortTasks(tasks: Task[]): Task[]
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `tasks` | `Task[]` | Array of tasks to sort |

**Returns**: `Task[]` - Sorted array (new array, original unchanged)

**Sort Priority**:
1. **Status**: Incomplete tasks before completed
2. **Overdue**: Overdue tasks first
3. **Priority**: urgent → high → medium → low
4. **Due Date**: Earliest first

**Completed Tasks**: Sorted by completion date (most recent first)

**Used in**: All task list displays, detail pages

---

## 📁 CSV Export

### `exportToCSV(data, columns, filename)`

Exports data to a CSV file and triggers browser download.

```typescript
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: string; header: string }>,
  filename: string
): void
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of objects to export |
| `columns` | `Array<{key, header}>` | Column definitions |
| `filename` | `string` | Base filename (date appended) |

**Column Definition**:
```typescript
{
  key: string;    // Object property to extract
  header: string; // CSV column header
}
```

**Example**:
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

**CSV Format**:
- Properly escapes quotes (doubles them)
- Wraps fields containing commas, quotes, or newlines in quotes
- UTF-8 encoded
- Unix line endings (`\n`)

**Used in**: Leads, Contacts, Deals list views (Export CSV buttons)

---

## ⏱️ Debounce

### `debounce(func, wait)`

Creates a debounced version of a function.

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `func` | `T` | Function to debounce |
| `wait` | `number` | Debounce delay in milliseconds |

**Returns**: `Function` - Debounced function

**Behavior**:
- Delays execution until `wait` milliseconds have elapsed
- Cancels previous pending execution if called again
- Only executes the last call after the delay

**Example**:
```typescript
const debouncedSearch = useCallback(
  debounce((value: string) => setSearch(value), 300),
  [setSearch]
);

useEffect(() => {
  debouncedSearch(searchInput);
}, [searchInput, debouncedSetSearch]);
```

**Used in**: Search inputs on Leads, Contacts, Deals pages (300ms delay)

---

## 📊 Type Definitions

### `RelationshipLabel`

```typescript
type RelationshipLabel = 'Cold' | 'Warm' | 'Hot'
```

### `DealHealth`

```typescript
type DealHealth = 'green' | 'amber' | 'red'
```

---

## 🔗 Related Files

| File | Relationship |
|------|--------------|
| `src/lib/types.ts` | Type definitions used by helpers |
| `src/pages/core/Leads.tsx` | Uses lead scoring, CSV export |
| `src/pages/core/Contacts.tsx` | Uses relationship scoring |
| `src/pages/core/Deals.tsx` | Uses deal health, CSV export |
| `src/pages/core/Tasks.tsx` | Uses task sorting, overdue check |

---

## 📝 Best Practices

1. **Pure Functions**: All helper functions are pure (no side effects)
2. **Immutability**: Functions return new values, don't mutate inputs
3. **Type Safety**: Full TypeScript typing for all functions
4. **Null Safety**: Handles null/undefined inputs gracefully
5. **Performance**: Debounce expensive operations (search)

---

## 🧪 Testing Examples

```typescript
// Lead scoring
expect(calculateLeadScore({
  email: 'test@example.com',
  phone: '123',
  company: 'Acme',
  source: 'referral',
  status: 'qualified'
})).toBe(85);

// Relationship scoring
expect(calculateRelationshipScore(5, new Date().toISOString(), true)).toBe(100);

// Currency formatting
expect(formatCurrency(1234.56)).toBe('$1,235');

// Relative time
expect(relativeTime(new Date(Date.now() - 3600000).toISOString())).toBe('1 hour ago');

// Task sorting
const sorted = sortTasks([highPriorityTask, overdueTask, completedTask]);
expect(sorted[0].status).not.toBe('completed');
```

---

**Last Updated**: March 28, 2026  
**Maintainer**: Development Team
