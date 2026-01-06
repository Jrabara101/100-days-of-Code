# FiscalNode — Enterprise Budgeting Engine

## Senior Full Stack Implementation (PHP/MySQL + React)

This project implements a high-performance budgeting platform focusing on **Enterprise Design Patterns**, **Recursive Data Aggregation**, and **Predictive Analytics**.

### Architecture
- **Backend**: Native PHP 8.2 (No Framework) with strict MVC pattern.
- **Database**: MySQL 8.0 with Recursive CTEs, Stored Procedures, and Triggers.
- **Frontend**: React + Vite + Custom Bootstrap SCSS (Fintech Dark Theme).
- **State Management**: React Query (TanStack Query) for optimistic UI.

### Setup Instructions

#### 1. Database
Create a MySQL database named `fiscal_node` and import the schema:
```sql
CREATE DATABASE fiscal_node;
-- Import the schema from backend/db/schema.sql
-- (You can use MySQL Workbench or CLI)
source backend/db/schema.sql;
```
*Note: The schema includes the `view_budget_burn_rates` (Recursive Aggregation Engine) and audit triggers.*

#### 2. Backend API
Navigate to the `backend` directory and start the built-in server:
```bash
cd backend
composer install
cp .env.example .env # (If needed, check variables)
php -S localhost:8000 -t public
```

#### 3. Frontend Application
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```

### Key "Senior" Features Implemented
1.  **Recursive Budgeting**: SQL View uses CTEs to handle nested budget categories (Housing -> Rent) without N+1 query problems.
2.  **ACID Transactions**: `TransactionController` uses `beginTransaction()` and `commit()` for data integrity.
3.  **Predictive Analytics**: The "Budget Health" dashboard calculates projected overage based on day-of-month velocity.
4.  **Fintech Aesthetics**: Custom SCSS theme overrides Bootstrap defaults for a premium dark mode experience.
