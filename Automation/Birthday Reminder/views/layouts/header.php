<?php
/* Layout Header — sidebar + topbar + flash messages */
$currentPage  = sanitize($_GET['page']   ?? 'dashboard');
$currentAction= sanitize($_GET['action'] ?? 'index');
$flashSuccess = get_flash('success');
$flashError   = get_flash('error');
?><!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Birthday Reminder Automation System — never miss a birthday again.">
  <title><?= isset($pageTitle) ? e($pageTitle) . ' — ' : '' ?><?= e(APP_NAME) ?></title>

  <!-- Fonts + Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" defer></script>

  <!-- App CSS -->
  <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/app.css">
</head>
<body>

<div class="app-wrapper">

  <!-- ════════════ SIDEBAR ════════════ -->
  <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">

    <div class="sidebar-header">
      <a href="<?= url('page=dashboard') ?>" class="sidebar-logo" style="text-decoration:none">
        <span class="logo-icon">🎂</span>
        <span class="logo-text"><?= e(APP_NAME) ?></span>
      </a>
      <button class="sidebar-close" id="sidebarClose" aria-label="Close navigation">✕</button>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li>
          <a href="<?= url('page=dashboard') ?>"
             class="nav-link <?= $currentPage === 'dashboard' ? 'active' : '' ?>"
             id="nav-dashboard">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </a>
        </li>
        <li>
          <a href="<?= url('page=birthdays') ?>"
             class="nav-link <?= ($currentPage === 'birthdays' && $currentAction === 'index') ? 'active' : '' ?>"
             id="nav-birthdays">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Manage Birthdays
          </a>
        </li>
        <li>
          <a href="<?= url('page=birthdays&action=create') ?>"
             class="nav-link <?= ($currentPage === 'birthdays' && in_array($currentAction, ['create', 'edit'])) ? 'active' : '' ?>"
             id="nav-add-birthday">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Birthday
          </a>
        </li>
        <li>
          <a href="<?= url('page=reminders') ?>"
             class="nav-link <?= $currentPage === 'reminders' ? 'active' : '' ?>"
             id="nav-reminders">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Reminder History
          </a>
        </li>
        <li>
          <a href="<?= url('page=logs') ?>"
             class="nav-link <?= $currentPage === 'logs' ? 'active' : '' ?>"
             id="nav-logs">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Automation Logs
          </a>
        </li>
        <li>
          <a href="<?= url('page=settings') ?>"
             class="nav-link <?= $currentPage === 'settings' ? 'active' : '' ?>"
             id="nav-settings">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33
                       1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.09-1.52 1.65 1.65 0 0 0-1.82.33
                       l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4
                       h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0
                       0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0
                       1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2
                       2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </a>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <p class="sidebar-version">v<?= APP_VERSION ?> · <?= e(APP_NAME) ?></p>
    </div>

  </aside>

  <!-- Sidebar Overlay (mobile) -->
  <div class="sidebar-overlay" id="sidebarOverlay" role="presentation"></div>

  <!-- ════════════ MAIN ════════════ -->
  <div class="main-wrapper">

    <!-- Topbar -->
    <header class="topbar" role="banner">
      <div class="topbar-left">
        <button class="menu-toggle" id="menuToggle" aria-label="Open navigation" aria-controls="sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20" aria-hidden="true">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="topbar-breadcrumb">
          <span class="topbar-title">
            <?php
            $titles = [
              'dashboard' => 'Dashboard',
              'birthdays' => $currentAction === 'create' ? 'Add Birthday'
                          : ($currentAction === 'edit'   ? 'Edit Birthday' : 'Manage Birthdays'),
              'reminders' => 'Reminder History',
              'logs'      => 'Automation Logs',
              'settings'  => 'Settings',
            ];
            echo e($titles[$currentPage] ?? ucfirst($currentPage));
            ?>
          </span>
        </div>
      </div>

      <div class="topbar-right">
        <span class="topbar-date"><?= date('F j, Y') ?></span>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
          <span class="theme-icon">🌙</span>
        </button>
      </div>
    </header>

    <!-- Flash Messages -->
    <?php if ($flashSuccess): ?>
    <div class="alert alert-success toast-alert" id="flashAlert" role="alert">
      <span class="alert-icon">✓</span>
      <span><?= $flashSuccess['message'] ?></span>
      <button class="alert-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>
    </div>
    <?php endif; ?>

    <?php if ($flashError): ?>
    <div class="alert alert-danger toast-alert" id="flashAlert" role="alert">
      <span class="alert-icon">⚠</span>
      <span><?= e($flashError['message']) ?></span>
      <button class="alert-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>
    </div>
    <?php endif; ?>

    <!-- Page Content -->
    <main class="content" id="main-content">
