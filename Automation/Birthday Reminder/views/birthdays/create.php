<?php $pageTitle = 'Add Birthday'; ?>

<div class="page-header">
  <div>
    <h1 class="page-title">✨ Add Birthday</h1>
    <p class="page-subtitle">Add a new person and configure their reminder schedule.</p>
  </div>
  <a href="<?= url('page=birthdays') ?>" class="btn btn-outline" id="btn-back">← Back to List</a>
</div>

<form method="POST" action="<?= url('page=birthdays&action=store') ?>" novalidate id="birthdayCreateForm">
  <?= csrf_input() ?>

  <!-- Person Details -->
  <div class="form-section">
    <h2 class="form-section-title">👤 Person Details</h2>
    <div class="form-grid">

      <div class="form-group">
        <label class="form-label" for="full_name">Full Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="full_name" name="full_name"
               class="form-control <?= isset($errors['full_name']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['full_name'] ?? '') ?>"
               placeholder="e.g. Jane Smith"
               required autocomplete="name">
        <?php if (isset($errors['full_name'])): ?>
        <span class="form-error" role="alert"><?= e($errors['full_name']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="date_of_birth">Date of Birth <span style="color:var(--danger)">*</span></label>
        <input type="date" id="date_of_birth" name="date_of_birth"
               class="form-control <?= isset($errors['date_of_birth']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['date_of_birth'] ?? '') ?>"
               max="<?= date('Y-m-d') ?>"
               required>
        <?php if (isset($errors['date_of_birth'])): ?>
        <span class="form-error" role="alert"><?= e($errors['date_of_birth']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="email">Email Address <span style="color:var(--danger)">*</span></label>
        <input type="email" id="email" name="email"
               class="form-control <?= isset($errors['email']) ? 'is-invalid' : '' ?>"
               value="<?= e($old['email'] ?? '') ?>"
               placeholder="jane@example.com"
               required autocomplete="email">
        <?php if (isset($errors['email'])): ?>
        <span class="form-error" role="alert"><?= e($errors['email']) ?></span>
        <?php endif; ?>
      </div>

      <div class="form-group">
        <label class="form-label" for="phone">Phone Number <small style="color:var(--text-light)">(optional)</small></label>
        <input type="tel" id="phone" name="phone"
               class="form-control"
               value="<?= e($old['phone'] ?? '') ?>"
               placeholder="+1-555-0123"
               autocomplete="tel">
      </div>

      <div class="form-group full">
        <label class="form-label" for="custom_note">Custom Note <small style="color:var(--text-light)">(optional)</small></label>
        <textarea id="custom_note" name="custom_note"
                  class="form-control"
                  placeholder="e.g. Loves chocolate cake, prefers no surprises, send card to office…"><?= e($old['custom_note'] ?? '') ?></textarea>
      </div>

    </div>
  </div>

  <!-- Reminder Rules -->
  <div class="form-section">
    <h2 class="form-section-title">🔔 Reminder Rules</h2>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
      Define when and how you want to be reminded. You can add multiple rules per person.
    </p>

    <div class="rules-container" id="rulesContainer">
      <!-- Default first rule row -->
      <div class="rule-row">
        <div class="form-group">
          <label class="form-label">Remind Me</label>
          <select name="days_before[]" class="form-control" id="days_before_0">
            <option value="0">Same Day</option>
            <option value="1">1 Day Before</option>
            <option value="3">3 Days Before</option>
            <option value="7">7 Days Before</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Via</label>
          <select name="delivery_type[]" class="form-control" id="delivery_type_0">
            <option value="dashboard">🔔 Dashboard</option>
            <option value="email">✉ Email</option>
            <option value="sms">💬 SMS</option>
          </select>
        </div>
        <button type="button" class="rule-remove" title="Remove rule" aria-label="Remove rule"
                onclick="removeRuleRow(this)">✕</button>
      </div>
    </div>

    <button type="button" class="btn btn-outline btn-sm" id="addRuleBtn" style="margin-top:14px">
      + Add Another Rule
    </button>

    <div style="margin-top:20px">
      <label class="form-check">
        <input type="checkbox" name="is_recurring" value="1" checked id="is_recurring">
        <span>Repeat every year (recurring annual reminder)</span>
      </label>
    </div>
  </div>

  <!-- Submit -->
  <div style="display:flex;gap:12px;justify-content:flex-end">
    <a href="<?= url('page=birthdays') ?>" class="btn btn-outline">Cancel</a>
    <button type="submit" class="btn btn-primary" id="btn-save-birthday">
      🎂 Save Birthday
    </button>
  </div>

</form>
