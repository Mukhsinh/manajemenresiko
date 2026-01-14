# Technical Design Document

## Overview

Dokumen ini menjelaskan desain teknis untuk memperbaiki masalah UI pada halaman Rencana Strategis. Perbaikan mencakup fungsi tombol, filter, dan perubahan warna header tabel dari ungu gradasi menjadi biru solid.

## Architecture

### Component Structure

```
Rencana Strategis Page
├── Header Section
│   └── Page Title & Breadcrumb
├── Statistics Cards Section
│   ├── Card Aktif
│   ├── Card Draft
│   ├── Card Selesai
│   └── Card Total
├── Filter Section
│   ├── Year Filter (Dropdown)
│   ├── Unit Kerja Filter (Dropdown)
│   ├── Status Filter (Dropdown)
│   ├── Search Filter (Text Input)
│   └── Reset Filter Button
├── Form Section (Collapsible)
│   ├── Form Header with Toggle
│   ├── Form Fields
│   └── Action Buttons (Simpan, Reset, Batal)
└── Data Table Section
    ├── Table Header (Blue Solid)
    ├── Table Body with Data Rows
    └── Row Actions (View, Edit, Delete)
```

## Components and Interfaces

### 1. Button Handler Module

```javascript
// Interface for button handlers
interface ButtonHandler {
  handleAdd(): void;
  handleEdit(id: string): void;
  handleDelete(id: string): Promise<void>;
  handleSave(data: FormData): Promise<void>;
  handleCancel(): void;
  handleExport(): void;
  showLoading(button: HTMLElement): void;
  hideLoading(button: HTMLElement): void;
}
```

### 2. Filter Module

```javascript
// Interface for filter state
interface FilterState {
  year: string;
  unitKerja: string;
  status: string;
  search: string;
}

// Interface for filter manager
interface FilterManager {
  state: FilterState;
  applyFilters(): void;
  resetFilters(): void;
  updateFilter(key: string, value: string): void;
  getFilteredCount(): number;
}
```

### 3. Table Header Styling

```css
/* Blue solid header styling */
.table thead th {
  background: #007bff !important;
  background-image: none !important;
  color: white !important;
}
```

## Data Models

### RencanaStrategis Model

```javascript
interface RencanaStrategis {
  id: string;
  kode: string;
  nama_rencana: string;
  deskripsi: string;
  visi_misi_id: string;
  periode_mulai: string;
  periode_selesai: string;
  target: string;
  status: 'Draft' | 'Aktif' | 'Selesai';
  created_at: string;
  updated_at: string;
}
```

### FilterState Model

```javascript
interface FilterState {
  year: string;        // Format: YYYY or empty
  unitKerja: string;   // UUID or empty
  status: string;      // 'Draft' | 'Aktif' | 'Selesai' | ''
  search: string;      // Free text search
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Add Button Shows Empty Form
*For any* initial state, clicking the "Tambah Data" button should result in the form being displayed with all fields empty or set to default values.
**Validates: Requirements 1.1**

### Property 2: Edit Button Populates Form Correctly
*For any* record in the data table, clicking the "Edit" button should populate the form with values that exactly match the record's data.
**Validates: Requirements 1.2**

### Property 3: Save Creates Valid Record
*For any* valid form data, clicking "Simpan" should result in a new record appearing in the table with matching values.
**Validates: Requirements 1.4**

### Property 4: Loading State During Async Operations
*For any* button that triggers an async operation, the button should display a loading indicator while the operation is in progress.
**Validates: Requirements 1.7**

### Property 5: Year Filter Shows Matching Records Only
*For any* selected year value, the table should display only records where the periode_mulai or periode_selesai contains that year.
**Validates: Requirements 2.1**

### Property 6: Status Filter Shows Matching Records Only
*For any* selected status value, the table should display only records with that exact status.
**Validates: Requirements 2.3**

### Property 7: Search Filter With Debounce
*For any* search text input, the filter should only be applied after 300ms of no typing, and should match records containing the search text in nama_rencana.
**Validates: Requirements 2.4**

### Property 8: Combined Filters Use AND Logic
*For any* combination of active filters, the displayed records should satisfy ALL filter criteria simultaneously.
**Validates: Requirements 2.5**

### Property 9: Filter Count Matches Displayed Records
*For any* filter state, the displayed count should exactly match the number of visible records in the table.
**Validates: Requirements 2.7**

### Property 10: Table Header Consistent Blue Color
*For any* table on the page, the header background color should be #007bff (or equivalent) without any gradient.
**Validates: Requirements 3.1, 3.2, 3.5**

## Error Handling

### Button Error Handling

```javascript
async function handleButtonAction(action, button) {
  try {
    showLoading(button);
    await action();
    showSuccessMessage('Operasi berhasil');
  } catch (error) {
    console.error('Button action error:', error);
    showErrorMessage('Terjadi kesalahan: ' + error.message);
  } finally {
    hideLoading(button);
  }
}
```

### Filter Error Handling

```javascript
function applyFilters() {
  try {
    const filtered = filterData(state.data, filterState);
    renderTable(filtered);
    updateFilterCount(filtered.length);
  } catch (error) {
    console.error('Filter error:', error);
    showErrorMessage('Gagal memfilter data');
    resetFilters();
  }
}
```

## Testing Strategy

### Unit Tests

1. **Button Handler Tests**
   - Test each button click triggers correct handler
   - Test loading state appears and disappears correctly
   - Test form population on edit
   - Test form reset on cancel

2. **Filter Tests**
   - Test individual filter application
   - Test combined filter logic
   - Test debounce timing for search
   - Test reset clears all filters

3. **CSS Tests**
   - Test header background color
   - Test header text color
   - Test hover state color change

### Property-Based Tests

Using fast-check library for JavaScript property-based testing:

1. **Property Test: Edit Populates Form**
   - Generate random records
   - Click edit for each record
   - Verify form values match record

2. **Property Test: Filter Results**
   - Generate random filter combinations
   - Apply filters
   - Verify all displayed records match criteria

3. **Property Test: Save Creates Record**
   - Generate random valid form data
   - Save and verify record appears in table

### Integration Tests

1. **Full Workflow Test**
   - Add new record → Edit record → Delete record
   - Apply filters → Reset filters
   - Export data

2. **Concurrent Operations Test**
   - Multiple rapid button clicks
   - Filter while loading data
