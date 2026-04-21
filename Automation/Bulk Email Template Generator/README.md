# 📧 Bulk Email Template Generator

A powerful PHP CLI application for generating personalized email messages in bulk using contact data from CSV or JSON files. Create reusable templates with dynamic placeholders, preview emails, and export results in multiple formats.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Template CRUD** | Create, edit, delete, list, search, and duplicate email templates |
| 📥 **Import Recipients** | Load contacts from CSV or JSON files |
| ✅ **Data Validation** | Validate emails, detect missing fields, show detailed reports |
| 🔄 **Dynamic Placeholders** | `{{name}}`, `{{email}}`, `{{company}}`, `{{role}}`, and custom fields |
| 👁️ **Email Preview** | Preview generated email for a single recipient before bulk run |
| 📊 **Bulk Generation** | Generate personalized emails for all recipients with progress bar |
| 📤 **Multi-Format Export** | Export to TXT, HTML, JSON, or CSV |
| 📋 **Generation History** | Track past generation runs with statistics |
| 🎨 **Beautiful CLI UI** | Colored output, boxed menus, breadcrumbs, progress bars |

---

## 📂 Project Structure

```
Bulk Email Template Generator/
├── index.php                    # Entry point
├── README.md                    # This file
├── src/
│   ├── App.php                  # Main application controller
│   ├── CLIUI.php                # CLI interface & display utilities
│   ├── TemplateManager.php      # Template CRUD operations
│   ├── RecipientManager.php     # Recipient import & management
│   ├── EmailGenerator.php       # Email generation & export
│   ├── FileManager.php          # File system operations
│   └── Validator.php            # Input & data validation
├── data/
│   ├── templates.json           # Saved email templates
│   └── history.json             # Generation history log
├── imports/
│   ├── sample_recipients.csv    # Sample CSV import file
│   └── sample_recipients.json   # Sample JSON import file
└── exports/                     # Generated email exports
```

---

## 🚀 Setup & Installation

### Prerequisites
- **PHP 8.1+** installed on your system
- PHP `readline` extension enabled (usually enabled by default)
- Terminal/command prompt with UTF-8 support

### Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd "Bulk Email Template Generator"
   ```

2. **Run the application:**
   ```bash
   php index.php
   ```

That's it! No Composer dependencies needed. 🎉

---

## 🖥️ Usage Guide

### Main Menu

When you launch the app, you'll see a beautifully styled main menu:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║    ✉   B U L K   E M A I L   T E M P L A T E             ║
  ║                  G E N E R A T O R                        ║
  ║                                                            ║
  ╚══════════════════════════════════════════════════════════════╝

  ╔════════════════════════════════════════════════════════════════╗
  ║                         Main Menu                            ║
  ╠════════════════════════════════════════════════════════════════╣
  ║  [1]  📝  Template Management                               ║
  ║  [2]  📥  Import Recipients                                  ║
  ║  [3]  ✉   Generate Emails                                   ║
  ║  [4]  📤  Export Emails                                      ║
  ║  [5]  📊  View History                                       ║
  ║  [6]  🔍  Search Templates                                   ║
  ║  [0]  ✘   Exit                                              ║
  ╚════════════════════════════════════════════════════════════════╝
```

### Step-by-Step Workflow

#### 1️⃣ Create a Template (Option 1 → 1)
- Enter a template name, type (text/html), subject, and body
- Use placeholders like `{{name}}`, `{{email}}`, `{{company}}`, `{{role}}`
- Preview your template before saving

#### 2️⃣ Import Recipients (Option 2)
- Select a file from the `/imports` directory or enter a custom path
- Supports `.csv` and `.json` formats
- See a validation report showing valid/invalid records

#### 3️⃣ Generate Emails (Option 3)
- **Preview Single**: Select a template and recipient to preview one email
- **Generate All**: Bulk generate for all valid recipients with a progress bar
- View the generation summary dashboard

#### 4️⃣ Export (Option 4)
- Choose from TXT, HTML, JSON, or CSV formats
- Exported files are saved to the `/exports` directory

---

## 📄 Template Placeholders

Use double curly braces to create dynamic placeholders:

| Placeholder | Description |
|------------|-------------|
| `{{name}}` | Recipient's full name |
| `{{email}}` | Recipient's email address |
| `{{company}}` | Company name |
| `{{role}}` | Job role/position |
| `{{subject}}` | Custom subject field |
| `{{custom_field}}` | Any custom field from your data |

### Example Template

**Subject:** `Welcome to {{company}}, {{name}}!`

**Body:**
```
Dear {{name}},

Welcome to {{company}}! We're excited to have you on board as a {{role}}.

Your registered email is {{email}}.

Best regards,
{{company}} HR Team
```

---

## 📊 Sample Data Format

### CSV Format (`imports/sample_recipients.csv`)
```csv
name,email,company,role
Alice Johnson,alice@techcorp.com,TechCorp,Software Engineer
Bob Smith,bob@designhub.io,DesignHub,UI/UX Designer
```

### JSON Format (`imports/sample_recipients.json`)
```json
[
    {
        "name": "Alice Johnson",
        "email": "alice@techcorp.com",
        "company": "TechCorp",
        "role": "Software Engineer"
    }
]
```

---

## 🛠️ Example Terminal Interaction

```
$ php index.php

  📍 Main Menu
  ──────────────────────────────────

  → Select an option: 2

  📥 Import Recipients

  ℹ  Files found in /imports directory:
  [1]  sample_recipients.csv
  [2]  sample_recipients.json

  → Enter file number or full path: 1
  ⠹ Importing recipients...

  ✔  Successfully imported 15 recipients!

  NAME                  EMAIL                     COMPANY           ROLE
  ─────────────────────────────────────────────────────────────────────
  Alice Johnson         alice@techcorp.com        TechCorp          Software Engineer
  Bob Smith             bob@designhub.io          DesignHub         UI/UX Designer
  ...

  ✔ Valid records:   15
  ✘ Invalid records: 0
  ⚠ Warnings:       0

  Press Enter to continue...
```

---

## 🔮 Future Improvements

- **SMTP Integration**: Send emails directly from the CLI
- **Template Variables Editor**: GUI-like variable mapping interface
- **Scheduling**: Schedule generation runs via cron
- **Attachments**: Support file attachments per template
- **CC/BCC Support**: Add CC and BCC fields
- **Template Versioning**: Track template changes over time
- **Config File**: External config for SMTP, defaults, etc.
- **Unit Tests**: PHPUnit test suite for all managers
- **Database Backend**: SQLite support for larger datasets
- **Markdown Templates**: Support Markdown-to-HTML conversion
- **Template Categories**: Organize templates by category/tag
- **Recipient Groups**: Group recipients for targeted sends
- **Undo/Redo**: Undo last action support

---

## 📋 Technical Details

| Item | Detail |
|------|--------|
| Language | PHP 8.1+ |
| Dependencies | None (zero external dependencies) |
| Storage | JSON flat files |
| Architecture | OOP with 7 dedicated classes |
| CLI Input | `readline()` |
| Terminal | ANSI escape codes for colors |
| Encoding | UTF-8 |

---

## 📝 License

This project is open-source and available for educational/portfolio use.

---

**Built with ❤️ using PHP CLI**
