# 📄 PHP CSV Reader & Writer

A professional, interactive **PHP CLI application** for creating, reading, overwriting, and appending CSV files — built as part of the **100 Days of Code** challenge.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Create CSV** | Define custom column headers and add initial rows |
| **Read CSV** | Display records in a beautifully formatted table |
| **Overwrite CSV** | Replace all content (with double confirmation) |
| **Append Rows** | Add new rows to an existing file |
| **Input Validation** | Every field is validated before writing |
| **Error Handling** | Friendly messages for missing files, bad input, etc. |
| **Attractive CLI UI** | ANSI colors, box-drawing characters, status icons |

---

## 📁 Folder Structure

```
CSV Reader/
├── main.php              ← Application entry point & App class
├── app/
│   ├── Terminal.php      ← All CLI output: colors, tables, prompts, messages
│   ├── CsvManager.php    ← CSV I/O: create, read, overwrite, append
│   └── Validator.php     ← Static input validation methods
├── data/
│   └── .gitkeep          ← CSV files are stored here at runtime
└── README.md
```

---

## 🚀 How to Run

```bash
# Navigate to the project directory
cd "c:\Users\Admin\100-days-of-Code\Automation\CSV Reader"

# Run the application
php main.php
```

> **Requirements:** PHP 8.0 or higher (uses named arguments and `str_ends_with`).

---

## 🖥️ Example CLI Session

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║        📄  PHP CSV READER & WRITER  📄               ║
║                                                      ║
║     Create · Read · Overwrite · Append CSV files     ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

  ┌─ MAIN MENU ───────────────────────────────┐
  │
  │  [1]  Create CSV File
  │  [2]  Read CSV File
  │  [3]  Overwrite CSV File
  │  [4]  Append Row(s) to CSV
  │  [5]  Exit
  │
  └────────────────────────────────────────────┘

  Enter your choice [1-5]: 1

──────────────── CREATE CSV FILE ──────────────────

  Enter CSV filename (e.g. contacts): employees
  How many columns?: 3

  ℹ  Enter a name for each column:
  Column 1 name: Name
  Column 2 name: Department
  Column 3 name: Salary

  Would you like to add initial data rows now? (y/n): y
  How many rows do you want to add?: 2

  ℹ  Row 1 of 2:
    Name: Alice Johnson
    Department: Engineering
    Salary: 85000

  ℹ  Row 2 of 2:
    Name: Bob Martinez
    Department: Marketing
    Salary: 72000

  ✔  [SUCCESS] File 'employees.csv' created successfully.
  ℹ  [INFO] 2 row(s) written.

  Press [Enter] to return to the main menu...
```

```
──────────────── READ CSV FILE ──────────────────

  Available files:
    • employees.csv

  Enter CSV filename to read: employees

  ℹ  Reading: employees.csv

╔══════════════════╦═══════════════╦══════════╗
║ Name             ║ Department    ║ Salary   ║
╠══════════════════╬═══════════════╬══════════╣
║ Alice Johnson    ║ Engineering   ║ 85000    ║
║ Bob Martinez     ║ Marketing     ║ 72000    ║
╚══════════════════╩═══════════════╩══════════╝
  Showing 2 record(s).
```

---

## 🏗️ Architecture Overview

### `main.php` — App class
The orchestrator. Contains one handler method per menu action. Delegates all storage work to `CsvManager` and all rendering to `Terminal`. Keeps methods short and readable.

### `app/Terminal.php` — Terminal class
Single source of truth for everything you see on screen:
- `showBanner()` / `header()` / `divider()` — structural elements
- `prompt()` / `promptAndValidate()` / `confirm()` — user input
- `success()` / `error()` / `warn()` / `info()` — status messages
- `renderTable()` — dynamic column-width box table renderer

### `app/CsvManager.php` — CsvManager class
Handles all filesystem I/O:
- Sandboxes all files to the `data/` directory
- Strips/writes UTF-8 BOM for Excel compatibility
- Returns structured `['headers' => [...], 'rows' => [...]]` from `read()`
- Safe `append()` (opens in `a` mode, never truncates)

### `app/Validator.php` — Validator class
Pure static validation methods. Returns `true` on success or an error string. Fully decoupled from I/O and UI.

---

## 🔮 Future Improvements

1. **Search / Filter** — Find rows where a column matches a keyword
2. **Delete Row** — Remove a specific row by number
3. **Edit Row** — Update values in a specific row
4. **Sort** — Sort rows by any column (asc/desc)
5. **Export preview** — Show the raw CSV text before saving
6. **Multi-file context** — Work on multiple files in the same session
7. **Import from external path** — Copy a CSV into the data directory
8. **Column statistics** — Min, max, average for numeric columns

---

## 📝 License

MIT — Part of the 100 Days of Code learning project.
