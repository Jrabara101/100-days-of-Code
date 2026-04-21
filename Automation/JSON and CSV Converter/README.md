# Automation CLI PHP — CSV & JSON Converter

A polished, interactive **PHP 8+ CLI tool** to convert between **CSV** and **JSON** formats with a beautiful terminal UI.

---

## 📁 Project Structure

```
JSON and CSV Converter/
├── index.php                        ← Main entry point (run this)
├── src/
│   ├── Converter.php                ← Core CSV↔JSON conversion logic
│   ├── ConversionWorkflow.php       ← Step-by-step guided conversion flows
│   └── helpers/
│       ├── CliRenderer.php          ← All CLI UI: colors, menus, tables, prompts
│       └── FileValidator.php        ← Input/output file validation helpers
├── samples/
│   ├── employees.csv                ← Sample CSV to test CSV → JSON
│   └── products.json                ← Sample JSON to test JSON → CSV
├── output/                          ← Recommended folder for your output files
└── README.md
```

---

## 🚀 How to Run

### Prerequisites
- **PHP 8.0 or higher** installed
- A terminal / command prompt

### Check your PHP version
```bash
php --version
```

### Run the application
Navigate to the project folder and run:
```bash
php index.php
```

---

## 🎯 Features

| Feature | Description |
|---|---|
| **CSV → JSON** | Parses CSV with headers and outputs a pretty-printed JSON array |
| **JSON → CSV** | Reads a JSON array of objects and writes a clean CSV |
| **ANSI Color UI** | Green ✔ success, Red ✘ errors, Yellow ⚠ warnings, Cyan ℹ info |
| **Data Preview** | Shows a formatted table of the first 3 rows before saving |
| **File Summary Box** | Displays file name, type, size, row count before conversion |
| **Conversion Summary** | Shows output path, records saved, and format after conversion |
| **Overwrite Confirmation** | Warns and asks before overwriting an existing file |
| **Input Retry Loops** | Keeps prompting until valid input is entered |
| **Loading Animations** | Spinner animations for Reading / Converting steps |
| **Screen Clearing** | Clears screen between major steps for clean UX |

---

## 💡 Usage Examples

### CSV → JSON
1. Select option **1** from the main menu
2. Enter the input CSV path:
   ```
   samples/employees.csv
   ```
3. Enter the output JSON path:
   ```
   output/employees.json
   ```
4. Review the data preview and confirm → conversion is done!

### JSON → CSV
1. Select option **2** from the main menu
2. Enter the input JSON path:
   ```
   samples/products.json
   ```
3. Enter the output CSV path:
   ```
   output/products.csv
   ```
4. Review the preview and confirm → done!

---

## ✅ Validation Rules

| Scenario | Handling |
|---|---|
| File not found | Error message + retry prompt |
| Empty file | Error message + retry prompt |
| Wrong extension | Clear explanation + retry |
| Invalid CSV format | Row/column mismatch error |
| Invalid JSON format | Decoding error with reason |
| Not an array of objects | Type validation error |
| Output dir not writable | Permission error shown |
| File already exists | Overwrite confirmation prompt |

---

## 📋 Example Terminal Output

```
══════════════════════════════════════════════════════════════
  ⚡  CSV ↔ JSON Converter — Automation CLI PHP  ⚡
══════════════════════════════════════════════════════════════
  PHP CLI Tool  |  Pure PHP 8+  |  No Frameworks

  ┌────────────────────────────────────────────────────┐
  │          MAIN MENU — SELECT AN OPTION              │
  ├────────────────────────────────────────────────────┤
  │  1.  Convert CSV  →  JSON                          │
  │  2.  Convert JSON →  CSV                           │
  │  3.  Exit                                          │
  └────────────────────────────────────────────────────┘

  › Enter your choice: 1

  ┌────────────────────────────────────────────────────┐
  │              CSV → JSON CONVERSION                 │
  └────────────────────────────────────────────────────┘

  ℹ  Please enter the path to your .csv file.
  ℹ  Example: samples/data.csv

  › Input file path (.csv): samples/employees.csv
  ✔  File found: samples/employees.csv

  ▶  Reading file...

  ┌─ File Summary ──────────────────────────────────────┐
  │  File Name: employees.csv                           │
  │  File Type: CSV                                     │
  │  File Size: 0.32 KB                                 │
  │  Rows Found: 8 data row(s)                          │
  │  Columns: 5 column(s)                               │
  └─────────────────────────────────────────────────────┘

  ℹ  Here is a preview of the first rows:

  ┌────┬───────────────┬───────────────────────┬─────┬─────────────┐
  │ id │ name          │ email                 │ age │ department  │
  ├────┼───────────────┼───────────────────────┼─────┼─────────────┤
  │ 1  │ Alice Johnson │ alice@example.com     │ 28  │ Engineering │
  │ 2  │ Bob Smith     │ bob@example.com       │ 34  │ Marketing   │
  │ 3  │ Carol White   │ carol@example.com     │ 25  │ Design      │
  └────┴───────────────┴───────────────────────┴─────┴─────────────┘
  ... and 5 more row(s) not shown.

  ✔  Conversion complete!

  ┌─ Conversion Summary ────────────────────────────────┐
  │  Source File: employees.csv                         │
  │  Output File: employees.json                        │
  │  Output Path: C:\...\output\employees.json          │
  │  Records Saved: 8 item(s)                           │
  │  Output Format: JSON (Pretty Printed)               │
  └─────────────────────────────────────────────────────┘
```

---

## 🔮 Future Improvement Ideas

1. **Support multiple delimiters** — handle TSV (tab-separated) or semicolon-separated CSV
2. **Nested JSON support** — flatten nested objects when converting JSON → CSV
3. **Batch conversion** — convert all CSV/JSON files in a folder at once
4. **Configuration file** — save preferred output directory in a `config.json`
5. **Column mapping** — let user rename or reorder columns during conversion
6. **Encoding options** — support UTF-16 or ISO-8859-1 files
7. **Export statistics** — append conversion logs to a `history.log` file
8. **Interactive column filter** — choose which columns to include in the output
9. **Large file support** — stream large files instead of loading all into memory
10. **Unit tests** — add PHPUnit tests for `Converter` and `FileValidator` classes

---

## 🛠 Technical Notes

- **No frameworks used** — pure PHP 8+ with no Composer dependencies
- **Modular architecture** — logic separated into `Converter`, `CliRenderer`, `FileValidator`, and `ConversionWorkflow`
- **ANSI escape codes** — used for color output; works on Linux, macOS, Windows Terminal, and PowerShell
- **UTF-8 BOM** — added to CSV output for Excel compatibility
- **Windows path support** — backslashes are normalized to forward slashes internally

---

*Project: Automation CLI PHP — CSV and JSON Converter*  
*100 Days of Code — Automation Track*
