# PHP CLI To-Do List

A production-ready, clean-architecture CLI application for managing tasks, built with pure PHP 8+.

## Features
- **Clean Architecture**: Separation of concerns between Data (Model), Logic (App), and Persistence (Storage).
- **Persistent Storage**: Saves tasks to a `data/todos.json` file.
- **Colored Output**: Uses ANSI escape codes for clear terminal feedback.
- **Modular**: Easy to extend with new commands or storage engines.
- **Zero Dependencies**: Pure PHP, no Composer required.

## Installation & Run
Ensure you have PHP 8.0 or higher installed.

1.  Clone or download this folder.
2.  Open your terminal in this directory.
3.  Run the following command to see available options:
    ```bash
    php todo.php help
    ```

## Core Commands
- `add <title> [description]` - Add a new task.
- `list` - List all tasks.
- `done <id>` - Mark a task as completed.
- `delete <id>` - Remove a task.
- `edit <id> <title> [description]` - Update task details.
- `pending` - List only pending tasks.
- `completed` - List only completed tasks.
- `clear` - Clear all tasks (requires confirmation).
- `help` - Show usage instructions.

## Data Storage
The application uses a simple JSON file system for persistence:
- **Location**: `data/todos.json`
- **Auto-creation**: The directory and file are created automatically on first run.
- **Graceful Failure**: If the JSON becomes corrupted or is empty, the app handles it by initializing an empty task list instead of crashing.

## Architecture & Best Practices
- **PSR-4-like Autoloading**: Uses `spl_autoload_register` to keep the entry point clean and files organized.
- **Defensive Programming**: Validates input arguments and handles JSON exceptions.
- **Entity Identification**: Tasks are managed via unique auto-incrementing IDs.
- **Type Hinting**: Utilizes PHP 8+ constructor property promotion and strict typing.

## Example Usage
```bash
# Add a task
php todo.php add "Learn PHP 8" "Focus on Constructor Promotion"

# List tasks
php todo.php list

# Mark as done
php todo.php done 1

# View specific lists
php todo.php pending
php todo.php completed
```
