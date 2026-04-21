<?php
$pageTitle = 'Edit Birthday';
$b = $birthday; // alias
?>

<div class="page-header">
  <div>
    <h1 class="page-title">✏️ Edit Birthday</h1>
    <p class="page-subtitle">Updating record for <strong><?= e($b['full_name']) ?></strong></p>
  </div>
  <a href="<?= url('page=birthdays') ?>" class="btn btn-outline" id="btn-back">← Back to List</a>
</div>

<form method="POST" action="<?= url('page=birthdays&action=update') ?>" novalidate id="birthdayEditForm">
  <?= csrf_input() ?>
  <input type="hidden" name="id" value="<?= (int)$b['id'] ?>">

  <!-- Person Details -->
  <div class="form-section">
    <h2 class="form-section-title">👤 Person Details</h2>
    <div class="form-grid">

      <div class="form-group">
        <label class="form-label" for="full_name">Full Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="full_name" name="full_name"
               class="form-control <?= isset($errors['full_name']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['full_name'] ?? $b['full_name']) ?>"
               required autocomplete="name">
        <?php if (isset($errors['full_name'])): ?>
        <span class="form-error"><?= e($errors['full_name']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="date_of_birth">Date of Birth <span style="color:var(--danger)">*</span></label>
        <input type="date" id="date_of_birth" name="date_of_birth"
               class="form-control <?= isset($errors['date_of_birth']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['date_of_birth'] ?? $b['date_of_birth']) ?>"
               max="<?= date('Y-m-d') ?>"
               required>
        <?php if (isset($errors['date_of_birth'])): ?>
        <span class="form-error"><?= e($errors['date_of_birth']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="email">Email Address <span style="color:var(--danger)">*</span></label>
        <input type="email" id="email" name="email"
               class="form-control <?= isset($errors['email']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['email'] ?? $b['email']) ?>"
               required autocomplete="email">
        <?php if (isset($errors['email'])): ?>
        <span class="form-error"><?= e($errors['email']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="phone">Phone <small style="color:var(--text-light)">(optional)</small></label>
        <input type="tel" id="phone" name="phone"
               class="form-control"
               value="<?= e($old['phone'] ?? $b['phone']) ?>"
               autocomplete="tel">
      </div>

      <div class="form-group full">
        <label class="form-label" for="custom_note">Custom Note <small style="color:var(--text-light)">(optional)</small></label>
        <textarea id="custom_note" name="custom_note" class="form-control"><?= e($old['custom_note'] ?? $b['custom_note']) ?></textarea>
      </div>

    </div>
  </div>

  <!-- Existing Reminder Rules -->
  <div class="form-section">
    <h2 class="form-section-title">🔔 Reminder Rules</h2>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
      Existing rules will be replaced. Add all the rules you want below.
    </p>

    <div class="rules-container" id="rulesContainer">
      <?php if (empty($rules)): ?>
      <!-- Default empty row if no existing rules -->
      <div class="rule-row">
        <div class="form-group">
          <label class="form-label">Remind Me</label>
          <select name="days_before[]" class="form-control">
            <option value="0">Same Day</option>
            <option value="1">1 Day Before</option>
            <option value="3">3 Days Before</option>
            <option value="7">7 Days Before</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Via</label>
          <select name="delivery_type[]" class="form-control">
            <option value="dashboard">🔔 Dashboard</option>
            <option value="email">✉ Email</option>
            <option value="sms">💬 SMS</option>
          </select>
        </div>
        <button type="button" class="rule-remove" onclick="removeRuleRow(this)"
                title="Remove" aria-label="Remove rule">✕</button>
      </div>
      <?php else: ?>
      <?php foreach ($rules as $rule): ?>
      <div class="rule-row">
        <div class="form-group">
          <label class="form-label">Remind Me</label>
          <select name="days_before[]" class="form-control">
            <option value="0" <?= (int)$rule['days_before'] === 0 ? 'selected' : '' ?>>Same Day</option>
            <option value="1" <?= (int)$rule['days_before'] === 1 ? 'selected' : '' ?>>1 Day Before</option>
            <option value="3" <?= (int)$rule['days_before'] === 3 ? 'selected' : '' ?>>3 Days Before</option>
            <option value="7" <?= (int)$rule['days_before'] === 7 ? 'selected' : '' ?>>7 Days Before</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Via</label>
          <select name="delivery_type[]" class="form-control">
            <option value="dashboard" <?= $rule['delivery_type'] === 'dashboard' ? 'selected' : '' ?>>🔔 Dashboard</option>
            <option value="email"     <?= $rule['delivery_type'] === 'email'     ? 'selected' : '' ?>>✉ Email</option>
            <option value="sms"       <?= $rule['delivery_type'] === 'sms'       ? 'selected' : '' ?>>💬 SMS</option>
          </select>
        </div>
        <button type="button" class="rule-remove" onclick="removeRuleRow(this)"
                title="Remove" aria-label="Remove rule">✕</button>
      </div>
      <?php endforeach; ?>
      <?php endif; ?>
    </div>

    <button type="button" class="btn btn-outline btn-sm" id="addRuleBtn" style="margin-top:14px">
      + Add Another Rule
    </button>

    <div style="margin-top:20px">
      <?php
      $isRecurring = !empty($rules) ? (int)$rules[0]['is_recurring'] : 1;
      ?>
      <label class="form-check">
        <input type="checkbox" name="is_recurring" value="1"
               id="is_recurring" <?= $isRecurring ? 'checked' : '' ?>>
        <span>Repeat every year (recurring annual reminder)</span>
      </label>
    </div>
  </div>

  <!-- Info + Submit -->
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <small style="color:var(--text-muted)">
      Added <?= format_date($b['created_at'], 'M j, Y') ?> ·
      Last updated <?= format_date($b['updated_at'], 'M j, Y') ?>
    </small>
    <div style="display:flex;gap:12px">
      <a href="<?= url('page=birthdays') ?>" class="btn btn-outline">Cancel</a>
      <button type="submit" class="btn btn-primary" id="btn-update-birthday">
        💾 Save Changes
      </button>
    </div>
  </div>

</form>
