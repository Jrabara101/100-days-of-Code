<?php $pageTitle = 'Reminder History'; ?>

<div class="page-header">
  <div>
    <h1 class="page-title">🔔 Reminder History</h1>
    <p class="page-subtitle"><?= count($reminders) ?> reminder<?= count($reminders) !== 1 ? 's' : '' ?> total</p>
  </div>
</div>

<!-- Filters -->
<form method="GET" action="<?= url('page=reminders') ?>" class="filter-bar" id="reminderFilterForm">
  <input type="hidden" name="page" value="reminders">

  <select name="status" class="form-control" style="max-width:160px" id="filter-status">
    <option value="">All Statuses</option>
    <option value="pending"   <?= $filters['status'] === 'pending'   ? 'selected' : '' ?>>⏳ Pending</option>
    <option value="sent"      <?= $filters['status'] === 'sent'      ? 'selected' : '' ?>>✉ Sent</option>
    <option value="completed" <?= $filters['status'] === 'completed' ? 'selected' : '' ?>>✓ Completed</option>
    <option value="failed"    <?= $filters['status'] === 'failed'    ? 'selected' : '' ?>>✕ Failed</option>
  </select>

  <select name="delivery_type" class="form-control" style="max-width:160px" id="filter-delivery">
    <option value="">All Types</option>
    <option value="dashboard" <?= $filters['delivery_type'] === 'dashboard' ? 'selected' : '' ?>>🔔 Dashboard</option>
    <option value="email"     <?= $filters['delivery_type'] === 'email'     ? 'selected' : '' ?>>✉ Email</option>
    <option value="sms"       <?= $filters['delivery_type'] === 'sms'       ? 'selected' : '' ?>>💬 SMS</option>
  </select>

  <select name="month" class="form-control" style="max-width:160px" id="filter-month">
    <option value="">All Months</option>
    <?php for ($m = 1; $m <= 12; $m++): ?>
    <option value="<?= $m ?>" <?= $filters['month'] == $m ? 'selected' : '' ?>><?= month_name($m) ?></option>
    <?php endfor; ?>
  </select>

  <button type="submit" class="btn btn-primary btn-sm">Filter</button>

  <?php if (array_filter($filters)): ?>
  <a href="<?= url('page=reminders') ?>" class="btn btn-outline btn-sm">Clear</a>
  <?php endif; ?>
</form>

<!-- Table -->
<div class="card">
  <div class="card-body" style="padding:0">
    <?php if (empty($reminders)): ?>
    <div class="empty-state" style="padding:60px 20px">
      <span class="empty-icon">📭</span>
      <p>No reminders found<?= array_filter($filters) ? ' with the selected filters' : '' ?>.<br>
         Run the cron script to generate reminders automatically.</p>
      <code class="code-hint" style="display:inline-block;margin-top:12px">php cron/cron_birthday_reminder.php</code>
    </div>
    <?php else: ?>
    <div class="table-responsive">
      <table class="table" id="remindersTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Recipient</th>
            <th>Birthday</th>
            <th>Reminder Date</th>
            <th>Type</th>
            <th>Status</th>
            <th>Sent At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($reminders as $i => $r): ?>
          <tr class="searchable-row">
            <td style="color:var(--text-light);font-size:12px"><?= $i + 1 ?></td>
            <td>
              <div class="table-name">
                <div class="avatar avatar--xs"><?= strtoupper(mb_substr($r['full_name'], 0, 1)) ?></div>
                <div>
                  <strong><?= e($r['full_name']) ?></strong><br>
                  <small style="color:var(--text-muted);font-size:11px"><?= e($r['email']) ?></small>
                </div>
              </div>
            </td>
            <td>
              <?= e(date('M j', strtotime($r['date_of_birth']))) ?>
              <span style="color:var(--text-light);font-size:11px">(<?= date('Y', strtotime($r['date_of_birth'])) ?>)</span>
            </td>
            <td><?= format_date($r['reminder_date']) ?></td>
            <td><?= delivery_badge($r['delivery_type']) ?></td>
            <td><?= status_badge($r['status']) ?></td>
            <td style="font-size:12px;color:var(--text-muted)">
              <?= $r['sent_at'] ? date('M j, g:i A', strtotime($r['sent_at'])) : '—' ?>
            </td>
            <td>
              <?php if ($r['status'] !== 'completed' && $r['status'] !== 'sent'): ?>
              <form method="POST" action="<?= url('page=reminders&action=mark') ?>" style="display:inline">
                <?= csrf_input() ?>
                <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
                <input type="hidden" name="status" value="completed">
                <button type="submit" class="btn btn-secondary btn-sm"
                        id="btn-complete-<?= $r['id'] ?>">Mark Done</button>
              </form>
              <?php else: ?>
              <span style="color:var(--text-light);font-size:12px">—</span>
              <?php endif; ?>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
