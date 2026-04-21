<?php $pageTitle = 'Manage Birthdays'; ?>

<div class="page-header">
  <div>
    <h1 class="page-title">🎂 Manage Birthdays</h1>
    <p class="page-subtitle"><?= count($birthdays) ?> record<?= count($birthdays) !== 1 ? 's' : '' ?> found</p>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <a href="<?= url('page=birthdays&action=export') ?>" class="btn btn-outline" id="btn-export-csv">
      ⬇ Export CSV
    </a>
    <a href="<?= url('page=birthdays&action=create') ?>" class="btn btn-primary" id="btn-add-birthday">
      + Add Birthday
    </a>
  </div>
</div>

<!-- Filter Bar -->
<form method="GET" action="<?= url('page=birthdays') ?>" class="filter-bar" id="filterForm">
  <input type="hidden" name="page" value="birthdays">

  <div class="filter-bar-search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0;color:var(--text-light)">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input type="text" name="search" id="tableSearch"
           placeholder="Search name, email, phone…"
           value="<?= e($search) ?>">
  </div>

  <select name="month" class="form-control" style="max-width:160px" id="filter-month">
    <option value="">All Months</option>
    <?php for ($m = 1; $m <= 12; $m++): ?>
    <option value="<?= $m ?>" <?= $month == $m ? 'selected' : '' ?>><?= month_name($m) ?></option>
    <?php endfor; ?>
  </select>

  <select name="sort" class="form-control" style="max-width:180px" id="filter-sort">
    <option value="upcoming"  <?= $sort === 'upcoming'  ? 'selected' : '' ?>>Sort: Upcoming</option>
    <option value="name_asc"  <?= $sort === 'name_asc'  ? 'selected' : '' ?>>Name A–Z</option>
    <option value="name_desc" <?= $sort === 'name_desc' ? 'selected' : '' ?>>Name Z–A</option>
    <option value="dob_asc"   <?= $sort === 'dob_asc'   ? 'selected' : '' ?>>Date of Birth</option>
  </select>

  <button type="submit" class="btn btn-primary btn-sm" id="btn-filter">Filter</button>

  <?php if ($search || $month || $sort !== 'upcoming'): ?>
  <a href="<?= url('page=birthdays') ?>" class="btn btn-outline btn-sm" id="btn-clear-filter">Clear</a>
  <?php endif; ?>
</form>

<!-- Birthday Table -->
<div class="card">
  <div class="card-body" style="padding:0">
    <?php if (empty($birthdays)): ?>
    <div class="empty-state" style="padding:60px 20px">
      <span class="empty-icon">😢</span>
      <p>No birthdays found<?= $search ? ' matching "' . e($search) . '"' : '' ?>.</p>
      <a href="<?= url('page=birthdays&action=create') ?>" class="btn btn-primary" style="margin-top:16px">Add First Birthday</a>
    </div>
    <?php else: ?>
    <div class="table-responsive">
      <table class="table" id="birthdaysTable">
        <thead>
          <tr>
            <th>Person</th>
            <th>Date of Birth</th>
            <th>Age / Countdown</th>
            <th>Contact</th>
            <th>Reminder Rules</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($birthdays as $b): ?>
          <tr class="searchable-row">
            <td>
              <div class="table-name">
                <div class="avatar avatar--sm"><?= strtoupper(mb_substr($b['full_name'], 0, 1)) ?></div>
                <div>
                  <strong><?= e($b['full_name']) ?></strong>
                  <?php if (!empty($b['custom_note'])): ?>
                  <br><small style="color:var(--text-muted);font-size:11px"><?= e(mb_substr($b['custom_note'], 0, 45)) ?><?= strlen($b['custom_note']) > 45 ? '…' : '' ?></small>
                  <?php endif; ?>
                </div>
              </div>
            </td>
            <td><?= e(date('M j, Y', strtotime($b['date_of_birth']))) ?></td>
            <td>
              <strong><?= $b['age'] ?></strong> yrs old<br>
              <?php if ((int)$b['days_left'] === 0): ?>
                <span class="badge badge-success">🎉 Today!</span>
              <?php elseif ((int)$b['days_left'] === 1): ?>
                <span class="badge badge-warning">Tomorrow</span>
              <?php elseif ((int)$b['days_left'] <= 7): ?>
                <span class="badge badge-primary"><?= $b['days_left'] ?> days</span>
              <?php else: ?>
                <span style="color:var(--text-muted);font-size:13px"><?= $b['days_left'] ?> days</span>
              <?php endif; ?>
            </td>
            <td>
              <a href="mailto:<?= e($b['email']) ?>" style="font-size:13px"><?= e($b['email']) ?></a>
              <?php if ($b['phone']): ?>
              <br><span style="color:var(--text-muted);font-size:12px"><?= e($b['phone']) ?></span>
              <?php endif; ?>
            </td>
            <td>
              <?php if (empty($b['rules'])): ?>
                <span style="color:var(--text-light);font-size:12px">None</span>
              <?php else: ?>
                <div style="display:flex;flex-direction:column;gap:4px">
                  <?php foreach ($b['rules'] as $rule): ?>
                  <span style="font-size:12px">
                    <?= delivery_badge($rule['delivery_type']) ?>
                    <span style="color:var(--text-muted);margin-left:4px"><?= days_before_label((int)$rule['days_before']) ?></span>
                    <?php if ($rule['is_recurring']): ?>
                    <span style="color:var(--text-light);font-size:11px">↻</span>
                    <?php endif; ?>
                  </span>
                  <?php endforeach; ?>
                </div>
              <?php endif; ?>
            </td>
            <td>
              <div class="table-actions">
                <a href="<?= url('page=birthdays&action=edit&id=' . $b['id']) ?>"
                   class="btn btn-outline btn-sm"
                   id="btn-edit-<?= $b['id'] ?>">Edit</a>
                <button class="btn btn-danger btn-sm"
                        id="btn-delete-<?= $b['id'] ?>"
                        onclick="confirmDelete(
                          <?= (int)$b['id'] ?>,
                          '<?= addslashes(e($b['full_name'])) ?>',
                          '<?= url('page=birthdays&action=delete') ?>'
                        )">Delete</button>
              </div>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
