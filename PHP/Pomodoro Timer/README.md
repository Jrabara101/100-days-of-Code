# PHP Pomodoro Timer

A simple, accurate CLI Pomodoro timer written in PHP.

## Features
- **Visual Progress Bar**: Real-time progress tracking in your terminal.
- **Custom Durations**: Set custom work and break times via command-line arguments.
- **System Notifications**: Native desktop notifications for:
  - macOS (`terminal-notifier`)
  - Linux (`notify-send`)
  - Windows (PowerShell Balloons)
- **Precision**: Uses `usleep()` and `microtime()` for accurate time tracking.

## Usage

Ensure you have PHP installed and in your system PATH.

### Basic Usage (Default: 25m Work / 5m Break)
```bash
php pomodoro.php
```

### Custom Durations
To set a 50-minute work session and a 10-minute break:
```bash
php pomodoro.php --work=50 --break=10
```
Or use the short flags:
```bash
php pomodoro.php -w 50 -b 10
```

## Requirements
- **PHP 7.4+**
- **Windows**: PowerShell (standard on Windows 10/11)
- **macOS**: `terminal-notifier` (Install via `brew install terminal-notifier`)
- **Linux**: `libnotify-bin` (Install via `sudo apt install libnotify-bin`)
