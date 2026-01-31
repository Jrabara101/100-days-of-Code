# CLI ShopScout

## Overview
A PHP CLI application for searching and filtering products with a premium ASCII interface.

## How to Run
1. Open your terminal.
2. Navigate to the directory:
   ```bash
   cd "c:\Users\Admin\100-days-of-Code\PHP\CLI Product"
   ```
3. Run the application:
   ```bash
   php shopscout.php
   ```

## Features
- **Multi-Criteria Filter**: Combine Category, Price, and Rating filters.
- **Keyword Search**: Uses `preg_grep` for fast searching.
- **Sorting**: Price (Low/High) and Rating (High).
- **Stock Alerts**: Color-coded indicators for Low Stock and Out of Stock.
- **Pagination**: Navigate through large inventories.

## Technical Details
- **Data Source**: `products.json`
- **Functions Used**: `array_filter`, `usort`, `array_map`, `preg_grep`.
- **Interface**: ANSI ASCII Table with persistent state.
