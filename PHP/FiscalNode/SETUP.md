# FiscalNode Setup Guide

## Quick Start

### 1. Database Setup
1. Create a MySQL database:
   ```sql
   CREATE DATABASE fiscal_node;
   ```
2. Import the schema:
   ```bash
   mysql -u root -p fiscal_node < backend/db/schema.sql
   ```
   Or use MySQL Workbench to import `backend/db/schema.sql`

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Create a `.env` file in the `backend` directory:
   ```env
   DB_HOST=127.0.0.1
   DB_NAME=fiscal_node
   DB_USER=root
   DB_PASS=your_password_here
   ```
   (Leave `DB_PASS` empty if your MySQL root user has no password)

4. Start the PHP server:
   ```bash
   php -S localhost:8000 -t public
   ```
   
   Or with the router script (recommended):
   ```bash
   php -S localhost:8000 -t public public/router.php
   ```

   The API will be available at `http://localhost:8000`

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or the port Vite assigns)

### 4. Testing the Connection
1. Open your browser to the frontend URL (usually `http://localhost:5173`)
2. The app will automatically check the API health on load
3. If you see budgets, the connection is working!

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/budgets` - Get all budgets (tree structure)
- `GET /api/budgets/:id` - Get budget details with transactions and predictions
- `POST /api/transactions` - Create a new transaction

## Database Initialization

### Option 1: Automatic Setup (Recommended)
1. Start the backend and frontend servers
2. Open the frontend in your browser
3. If you see a "Database Not Initialized" message, click the "Initialize Database" button
4. The tables will be created automatically

### Option 2: Manual Setup via SQL
1. Create the database:
   ```sql
   CREATE DATABASE fiscal_node;
   ```
2. Import the schema:
   ```bash
   mysql -u root -p fiscal_node < backend/db/schema.sql
   ```
   Or use MySQL Workbench to import `backend/db/schema.sql`

### Option 3: API Endpoint
You can also initialize the database via API:
```bash
curl -X POST http://localhost:8000/api/setup/database
```

Check database status:
```bash
curl http://localhost:8000/api/setup/check
```

## Troubleshooting

### Database Tables Don't Exist
**Error**: `Table 'fiscal_node.budgets' doesn't exist`

**Solution**: 
- Use the automatic setup button in the frontend (easiest)
- Or run: `POST /api/setup/database` endpoint
- Or manually import the schema from `backend/db/schema.sql`

### Database Connection Issues
- Verify your MySQL server is running
- Check that the database `fiscal_node` exists
- Verify your `.env` file has the correct credentials (create it in the `backend` directory if it doesn't exist)
- Default `.env` values:
  ```env
  DB_HOST=127.0.0.1
  DB_NAME=fiscal_node
  DB_USER=root
  DB_PASS=
  ```

### CORS Issues
- The backend already includes CORS headers
- If you still see CORS errors, check that the backend is running on port 8000
- Verify the Vite proxy configuration in `frontend/vite.config.js`

### API Not Responding
- Check that the PHP server is running: `php -S localhost:8000 -t public public/router.php`
- Test the health endpoint directly: `http://localhost:8000/api/health`
- Check browser console for error messages

### Trigger Creation Warnings
If you see warnings about trigger creation, that's okay - triggers are optional. The core functionality (tables and views) will still work.

