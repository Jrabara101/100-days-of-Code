<?php $pageTitle = 'Dashboard'; ?>

<!-- Page Header -->
<div class="page-header">
  <div>
    <h1 class="page-title">👋 Welcome Back</h1>
    <p class="page-subtitle">Here's everything happening with your birthday reminders today.</p>
  </div>
  <a href="<?= url('page=birthdays&action=create') ?>" class="btn btn-primary" id="btn-add-birthday">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
    Add Birthday
  </a>
</div>

<!-- Stat Cards -->
<div class="stats-grid">
  <div class="stat-card stat-card--blue">
    <div class="stat-card-icon">🎂</div>
    <div class="stat-card-body">
      <p class="stat-label">Total Birthdays</p>
      <h2 class="stat-value" data-count="<?= $stats['total_birthdays'] ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--emerald">
    <div class="stat-card-icon">🎉</div>
    <div class="stat-card-body">
      <p class="stat-label">Birthdays Today</p>
      <h2 class="stat-value" data-count="<?= $stats['birthdays_today'] ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--amber">
    <div class="stat-card-icon">📅</div>
    <div class="stat-card-body">
      <p class="stat-label">Upcoming (7 Days)</p>
      <h2 class="stat-value" data-count="<?= $stats['upcoming_7days'] ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--indigo">
    <div class="stat-card-icon">✅</div>
    <div class="stat-card-body">
      <p class="stat-label">Sent Reminders</p>
      <h2 class="stat-value" data-count="<?= $stats['sent_reminders'] ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--rose">
    <div class="stat-card-icon">⚠️</div>
    <div class="stat-card-body">
      <p class="stat-label">Failed Reminders</p>
      <h2 class="stat-value" data-count="<?= $stats['failed_reminders'] ?>">0</h2>
    </div>
  </div>
  <div class="stat-card stat-card--purple">
    <div class="stat-card-icon">⏳</div>
    <div class="stat-card-body">
      <p class="stat-label">Pending Reminders</p>
      <h2 class="stat-value" data-count="<?= $stats['pending_reminders'] ?>">0</h2>
    </div>
  </div>
</div>

<!-- Two-column grid -->
<div class="dashboard-grid">

  <!-- ══ Left Column ══ -->
  <div class="dashboard-col dashboard-col--wide">

    <?php if (!empty($todayBirthdays)): ?>
    <!-- Today's Birthdays -->
    <div class="card card--highlight">
      <div class="card-header">
        <h2 class="card-title">🎉 Birthdays Today!</h2>
        <span class="badge badge-success"><?= count($todayBirthdays) ?></span>
      </div>
      <div class="card-body">
        <?php foreach ($todayBirthdays as $b): ?>
        <div class="birthday-today-item">
          <div class="avatar"><?= strtoupper(mb_substr($b['full_name'], 0, 1)) ?></div>
          <div class="birthday-today-info">
            <strong><?= e($b['full_name']) ?></strong>
            <span>Turns <?= age_from_dob($b['date_of_birth']) ?> today · <?= e($b['email']) ?></span>
          </div>
          <?php if (!empty($b['custom_note'])): ?>
          <abbr class="birthday-today-note" title="<?= e($b['custom_note']) ?>">📝</abbr>
          <?php endif; ?>
          <a href="mailto:<?= e($b['email']) ?>" class="btn btn-sm btn-secondary">Send Wish</a>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- Upcoming Birthdays -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">📅 Upcoming Birthdays</h2>
        <a href="<?= url('page=birthdays') ?>" class="card-link">View All →</a>
      </div>
      <div class="card-body">
        <?php if (empty($upcomingBirthdays)): ?>
        <div class="empty-state">
          <span class="empty-icon">🎈</span>
          <p>No upcoming birthdays in the next 30 days.</p>
        </div>
        <?php else: ?>
        <div class="upcoming-list">
          <?php foreach (array_slice($upcomingBirthdays, 0, 8) as $b): ?>
          <div class="upcoming-item">
            <div class="avatar avatar--sm"><?= strtoupper(mb_substr($b['full_name'], 0, 1)) ?></div>
            <div class="upcoming-info">
              <strong><?= e($b['full_name']) ?></strong>
              <span><?= e(date('F j', strtotime($b['date_of_birth']))) ?> · <?= age_from_dob($b['date_of_birth']) + 1 ?> yrs</span>
            </div>
            <div class="upcoming-badge">
              <?php if ((int)$b['days_left'] === 0): ?>
                <span class="badge badge-success">Today! 🎉</span>
              <?php elseif ((int)$b['days_left'] === 1): ?>
                <span class="badge badge-warning">Tomorrow</span>
              <?php else: ?>
                <span class="badge badge-primary"><?= (int)$b['days_left'] ?> days</span>
              <?php endif; ?>
            </div>
          </div>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- Recent Reminder Activity -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">🔔 Recent Reminder Activity</h2>
        <a href="<?= url('page=reminders') ?>" class="card-link">View All →</a>
      </div>
      <div class="card-body">
        <?php if (empty($recentReminders)): ?>
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No reminders generated yet.<br>Run the cron script to start automation.</p>
          <code class="code-hint">php cron/cron_birthday_reminder.php</code>
        </div>
        <?php else: ?>
        <div class="table-responsive">
          <table class="table" id="recentRemindersTable">
            <thead>
              <tr>
                <th>Person</th>
                <th>Birthday</th>
                <th>Reminder Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($recentReminders as $r): ?>
              <tr>
                <td>
                  <div class="table-name">
                    <div class="avatar avatar--xs"><?= strtoupper(mb_substr($r['full_name'], 0, 1)) ?></div>
                    <?= e($r['full_name']) ?>
                  </div>
                </td>
                <td><?= e(date('M j', strtotime($r['date_of_birth']))) ?></td>
                <td><?= format_date($r['reminder_date']) ?></td>
                <td><?= delivery_badge($r['delivery_type']) ?></td>
                <td><?= status_badge($r['status']) ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>
      </div>
    </div>

  </div><!-- /.dashboard-col--wide -->

  <!-- ══ Right Column ══ -->
  <div class="dashboard-col dashboard-col--narrow">

    <!-- Next Birthday Widget -->
    <?php if ($nextBirthday): ?>
    <div class="card card--accent">
      <div class="card-header">
        <h2 class="card-title">🚀 Next Birthday</h2>
      </div>
      <div class="card-body text-center">
        <div class="avatar avatar--lg mx-auto"><?= strtoupper(mb_substr($nextBirthday['full_name'], 0, 1)) ?></div>
        <h3 class="widget-name"><?= e($nextBirthday['full_name']) ?></h3>
        <p class="widget-date">
          <?= e(date('F j', strtotime($nextBirthday['date_of_birth']))) ?>
          · Turning <?= age_from_dob($nextBirthday['date_of_birth']) + 1 ?>
        </p>
        <div class="countdown-widget">
          <div class="countdown-number" data-count="<?= (int)$nextBirthday['days_left'] ?>"><?= (int)$nextBirthday['days_left'] ?></div>
          <div class="countdown-label">
            <?= (int)$nextBirthday['days_left'] === 0 ? '🎉 Today!'
              : ((int)$nextBirthday['days_left'] === 1 ? 'day to go'
              : 'days to go') ?>
          </div>
        </div>
      </div>
    </div>
    <?php endif; ?>

    <!-- Monthly Distribution Chart -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">📊 By Month</h2>
      </div>
      <div class="card-body">
        <?php if (empty($monthlyData)): ?>
        <div class="empty-state">
          <span class="empty-icon">📊</span>
          <p>Add some birthdays to see the chart.</p>
        </div>
        <?php else: ?>
        <canvas id="monthlyChart" height="200" aria-label="Birthday distribution by month"></canvas>
        <?php endif; ?>
      </div>
    </div>

    <!-- Automation Status -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">⚙️ Automation Status</h2>
      </div>
      <div class="card-body">
        <?php if ($lastCronRun): ?>
        <div class="automation-status">
          <div class="status-indicator status-ok">
            <span class="status-dot" aria-hidden="true"></span>
            <span>System Active</span>
          </div>
          <ul class="automation-meta">
            <li><span>Last Run</span> <strong><?= date('M j, Y g:i A', strtotime($lastCronRun['run_at'])) ?></strong></li>
            <li><span>Checked</span>  <strong><?= $lastCronRun['birthdays_checked'] ?> birthdays</strong></li>
            <li><span>Generated</span><strong><?= $lastCronRun['reminders_generated'] ?> reminders</strong></li>
            <li><span>Sent</span>     <strong><?= $lastCronRun['reminders_sent'] ?> reminders</strong></li>
            <li><span>Duration</span> <strong><?= $lastCronRun['execution_ms'] ?>ms</strong></li>
          </ul>
        </div>
        <?php else: ?>
        <div class="empty-state">
          <span class="empty-icon">⏸️</span>
          <p>Cron script hasn't run yet.</p>
          <code class="code-hint">php cron/cron_birthday_reminder.php</code>
        </div>
        <?php endif; ?>
        <a href="<?= url('page=logs') ?>" class="btn btn-outline btn-sm btn-block mt-3" id="btn-view-logs">
          View All Logs
        </a>
      </div>
    </div>

  </div><!-- /.dashboard-col--narrow -->

</div><!-- /.dashboard-grid -->

<?php if (!empty($monthlyData)): ?>
<script>window.MONTHLY_DATA = <?= json_encode($monthlyData) ?>;</script>
<?php endif; ?>
