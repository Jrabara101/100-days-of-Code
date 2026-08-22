# Enterprise Warehouse Management System (WMS) & FIFO/FEFO Stock Movement Engine

An enterprise-grade Warehouse Management System (WMS) built in PHP CLI leveraging an **Immutable Double-Entry Movement Ledger**, **Atomic Concurrency Controls**, **Physical Bin Topology**, and **Automated FIFO/FEFO Expiration Allocation**.

---

## 🏛️ Architectural Overview

In high-throughput supply chain logistics, mutating inventory via raw `UPDATE products SET stock = stock - 5` commands results in race conditions, ghost inventory, and untraceable shrinkage. 

This engine solves these issues with two core architectures:

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ INBOUND LOT INGESTION │ ───► │ FIFO/FEFO PICK ALLOCATOR    │ ───► │ EXPIRED STOCK QUARANTINE    │
   │ (Lot #, MFR, Expiry)  │      │(Auto-split earliest expiry) │      │ (Atomic lock & zero-breach) │
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

---

## 📦 System Implementations

### 1. Base WMS Engine (`warehouse_tracker.php`)
- **Immutable Double-Entry Ledger**: Stock balances are derived from balanced credit/debit movement entries between physical storage bins and virtual clearance docks (`STAGE-INBOUND`, `STAGE-OUTBOUND`).
- **Atomic Concurrency & Over-Allocation Guard**:
  ```sql
  UPDATE bin_inventory 
  SET quantity = quantity - ? 
  WHERE location_id = ? AND product_id = ? AND quantity >= ?
  ```
  Zero-row update checks trigger immediate rollback and throw `UnderflowException`.
- **Volumetric Capacity Verification**: Physical bins reject incoming stock if $\sum \text{Current Units} + Q_{\text{inbound}} > \text{Max Capacity}$.
- **Cryptographic Audit Seal**: Generates a SHA-256 integrity hash for each movement record ($H = \text{SHA-256}(\text{movement\_code} \mathbin{\Vert} \text{SKU} \mathbin{\Vert} \text{Qty} \mathbin{\Vert} \text{From} \mathbin{\Vert} \text{To} \mathbin{\Vert} \text{Timestamp})$).

### 2. FIFO/FEFO Expiration Engine (`warehouse_fifo_tracker.php`)
- **Lot / Batch Immutability (`lots` Table)**: Every batch tracks manufacture date, expiration date, and lot identifier (`LOT-YYYYMM-XXXX`).
- **Composite Key Bin Inventory**:
  ```sql
  UNIQUE(location_id, product_id, lot_id)
  ```
  Enables multi-batch storage in identical physical bins without cross-contamination.
- **Automated FEFO/FIFO Split Picking**:
  - Automatically sorts batches by `expires_at ASC, created_at ASC`.
  - Splits pick quantities across multiple earliest-expiring lots until order demand is satisfied.
- **Zero-Breach Quarantine Interceptor**:
  - Automatically detects expired lots (`expires_at < CURRENT_DATE`).
  - Blocks dispatch on expired goods and routes them exclusively through explicit quarantine/scrap operations.

---

## 🚀 Usage & Commands

### Prerequisites
- PHP 8.1+ with `ext-pdo` and `ext-pdo_sqlite` extensions enabled.

### 1. Interactive WMS Workspace
Run the interactive ANSI TUI dashboard:

```bash
# Base WMS Tracker
php warehouse_tracker.php

# FIFO / FEFO Expiration Tracker
php warehouse_fifo_tracker.php
```

### 2. Headless Batch Simulation (CI/CD / Background AGVs)
Run automated movement passes and concurrency test suites:

```bash
# Base WMS Batch Mode
php warehouse_tracker.php --batch

# FIFO Batch Simulation Mode
php warehouse_fifo_tracker.php --batch
```

---

## 🧪 Simulation Walkthrough & Test Matrix

| Test Scenario | Action | Expected Result | Guard Mechanism |
| :--- | :--- | :--- | :--- |
| **Inbound Ingestion** | Ingest 30 units of `SKU-MED-INSULIN` (Lot 1) | Balance updated, ledger signed | Volumetric Capacity Check |
| **FEFO Multi-Lot Pick** | Pick 45 units with Lot 1 (30 units) and Lot 2 (40 units) | Takes 30 from Lot 1, 15 from Lot 2 | Automated Multi-Batch Split |
| **Expired Goods Pick** | Attempt to pick unexpired quota exceeding unexpired lots | Fails with explicit expired unit skip count | Expiration Interceptor |
| **Over-Allocation Pick** | Request 9999 units from single bin | Transaction rolled back | Atomic Underflow Guard |
| **Cryptographic Audit** | Verify Movement ID SHA-256 seal | Unbroken cryptographic proof | SHA-256 Ledger Signature |
