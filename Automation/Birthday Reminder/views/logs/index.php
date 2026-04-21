<?php $pageTitle = 'Automation Logs'; ?>

<div class="page-header">
  <div>
    <h1 class="page-title">⚙️ Automation Logs</h1>
    <p class="page-subtitle">Every cron execution is recorded here for audit and debugging.</p>
  </div>
  <?php if ($lastRun): ?>
  <div style="text-align:right">
    <span style="font-size:12px;color:var(--text-muted)">Last run</span><br>
    <strong style="font-size:14px"><?= date('M j, Y g:i A', strtotime($lastRun['run_at'])) ?></strong>
  </div>
  <?php endif; ?>
</div>

<!-- Stats Row -->
<?php if ($totalRuns > 0 && !empty($totals)): ?>
<div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr));margin-bottom:22px">
  <div class="stat-card stat-card--blue">
    <div class="stat-card-icon">🔄</div>
    <div class="stat-card-body">
      <p class="stat-label">Total Runs</p>
      <h2 class="stat-value" data-count="<?= $totalRuns ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--indigo">
    <div class="stat-card-icon">🎂</div>
    <div class="stat-card-body">
      <p class="stat-label">Total Checked</p>
      <h2 class="stat-value" data-count="<?= (int)($totals['total_checked'] ?? 0) ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--emerald">
    <div class="stat-card-icon">📝</div>
    <div class="stat-card-body">
      <p class="stat-label">Total Generated</p>
      <h2 class="stat-value" data-count="<?= (int)($totals['total_generated'] ?? 0) ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--amber">
    <div class="stat-card-icon">✉</div>
    <div class="stat-card-body">
      <p class="stat-label">Total Sent</p>
      <h2 class="stat-value" data-count="<?= (int)($totals['total_sent'] ?? 0) ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--purple">
    <div class="stat-card-icon">⚡</div>
    <div class="stat-card-body">
      <p class="stat-label">Avg Duration</p>
      <h2 class="stat-value" style="font-size:22px"><?= ceil((float)($totals['avg_ms'] ?? 0)) ?>ms</h2>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Setup Info Box -->
<div class="card" style="margin-bottom:22px">
  <div class="card-header">
    <h2 class="card-title">🛠 Cron Setup</h2>
    <span class="badge badge-info">Configuration</span>
  </div>
  <div class="card-body">
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">
      Run the automation script daily (recommended: 8:00 AM server time) to check birthdays and generate reminders.
    </p>
    <div class="cron-block">
      <span class="cron-comment"># Edit crontab: crontab -e</span><br>
      <span class="cron-cmd">0 8 * * * /usr/bin/php /var/www/html/birthday-reminder/cron/cron_birthday_reminder.php >> /var/log/birthday_cron.log 2>&1</span><br><br>
      <span class="cron-comment"># XAMPP (Windows Task Scheduler equivalent):</span><br>
      <span class="cron-cmd">C:\xampp\php\php.exe C:\Users\Admin\100-days-of-Code\Automation\Birthday Reminder\cron\cron_birthday_reminder.php</span><br><br>
      <span class="cron-comment"># Run manually for testing:</span><br>
      <span class="cron-cmd">php cron/cron_birthday_reminder.php</span>
    </div>
  </div>
</div>

<!-- Log Table -->
<div class="card">
  <div class="card-body" style="padding:0">
    <?php if (empty($logs)): ?>
    <div class="empty-state" style="padding:60px 20px">
      <span class="empty-icon">📋</span>
      <p>No automation runs yet.<br>Run the cron script above to generate the first log entry.</p>
    </div>
    <?php else: ?>
    <div class="table-responsive">
      <table class="table" id="logsTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Run At</th>
            <th>Birthdays Checked</th>
            <th>Reminders Generated</th>
            <th>Reminders Sent</th>
            <th>Errors</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($logs as $i => $log): ?>
          <?php $hasError = !empty($log['errors']) && $log['errors'] !== 'null'; ?>
          <tr class="<?= $hasError ? 'log-error-row' : '' ?>">
            <td style="color:var(--text-light);font-size:12px"><?= $i + 1 ?></td>
            <td style="font-size:13px;white-space:nowrap">
              <?= date('M j, Y', strtotime($log['run_at'])) ?><br>
              <span style="color:var(--text-muted)"><?= date('g:i:s A', strtotime($log['run_at'])) ?></span>
            </td>
            <td>
              <span class="log-success"><?= (int)$log['birthdays_checked'] ?></span>
            </td>
            <td>
              <span class="<?= (int)$log['reminders_generated'] > 0 ? 'log-success' : '' ?>">
                <?= (int)$log['reminders_generated'] ?>
              </span>
            </td>
            <td>
              <span class="<?= (int)$log['reminders_sent'] > 0 ? 'log-success' : '' ?>">
                <?= (int)$log['reminders_sent'] ?>
              </span>
            </td>
            <td class="log-errors-cell">
              <?php if ($hasError): ?>
              <?php
              $errs = json_decode($log['errors'], true) ?? [$log['errors']];
              ?>
              <abbr title="<?= e(implode('; ', (array)$errs)) ?>">
                <span class="badge badge-danger"><?= count($errs) ?> error<?= count($errs) !== 1 ? 's' : '' ?></span>
              </abbr>
              <?php else: ?>
              <span class="badge badge-success">OK</span>
              <?php endif; ?>
            </td>
            <td style="font-size:13px"><?= (int)$log['execution_ms'] ?>ms</td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
