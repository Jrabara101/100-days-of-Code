<?php
// ============================================================
// Birthday Controller — CRUD, search, filter, CSV export
// ============================================================

class BirthdayController extends Controller
{
    private Birthday     $model;
    private ReminderRule $ruleModel;

    public function __construct()
    {
        $this->model     = new Birthday();
        $this->ruleModel = new ReminderRule();
    }

    // ─── List ──────────────────────────────────────────────

    public function index(): void
    {
        $search = sanitize($_GET['search'] ?? '');
        $month  = sanitize($_GET['month']  ?? '');
        $sort   = sanitize($_GET['sort']   ?? 'upcoming');

        $birthdays = $this->model->getAll($search, $month, $sort);

        // Attach computed fields
        foreach ($birthdays as &$b) {
            $b['rules']    = $this->ruleModel->getByBirthdayId((int)$b['id']);
            $b['days_left'] = days_until_birthday($b['date_of_birth']);
            $b['age']       = age_from_dob($b['date_of_birth']);
        }
        unset($b);

        $this->render('birthdays/index', compact('birthdays', 'search', 'month', 'sort'));
    }

    // ─── Create Form ───────────────────────────────────────

    public function create(): void
    {
        $this->render('birthdays/create', ['errors' => [], 'old' => []]);
    }

    // ─── Store ─────────────────────────────────────────────

    public function store(): void
    {
        $this->requirePost();
        $this->validateCsrf();

        $data = $this->extractFormData();

        // Reminder rule arrays from the dynamic rule rows
        $daysBefore  = (array)($_POST['days_before']   ?? [0]);
        $deliveries  = (array)($_POST['delivery_type'] ?? ['dashboard']);
        $isRecurring = (int)($_POST['is_recurring']    ?? 1);

        $errors = $this->validate($data);

        if (empty($errors)) {
            $birthdayId = $this->model->create($data);

            foreach ($daysBefore as $i => $days) {
                $this->ruleModel->create([
                    'birthday_id'  => $birthdayId,
                    'days_before'  => (int)$days,
                    'delivery_type'=> sanitize($deliveries[$i] ?? 'dashboard'),
                    'is_recurring' => $isRecurring,
                ]);
            }

            flash('success', "Birthday for \"{$data['full_name']}\" added successfully!");
            $this->redirect('page=birthdays');
        }

        $this->render('birthdays/create', ['errors' => $errors, 'old' => $data]);
    }

    // ─── Edit Form ─────────────────────────────────────────

    public function edit(): void
    {
        $id       = (int)($_GET['id'] ?? 0);
        $birthday = $this->model->findById($id);

        if (!$birthday) {
            flash('error', 'Birthday record not found.', 'danger');
            $this->redirect('page=birthdays');
        }

        $rules = $this->ruleModel->getByBirthdayId($id);

        $this->render('birthdays/edit', [
            'birthday' => $birthday,
            'rules'    => $rules,
            'errors'   => [],
        ]);
    }

    // ─── Update ────────────────────────────────────────────

    public function update(): void
    {
        $this->requirePost();
        $this->validateCsrf();

        $id       = (int)($_POST['id'] ?? 0);
        $birthday = $this->model->findById($id);

        if (!$birthday) {
            flash('error', 'Birthday record not found.', 'danger');
            $this->redirect('page=birthdays');
        }

        $data        = $this->extractFormData();
        $daysBefore  = (array)($_POST['days_before']   ?? [0]);
        $deliveries  = (array)($_POST['delivery_type'] ?? ['dashboard']);
        $isRecurring = (int)($_POST['is_recurring']    ?? 1);

        $errors = $this->validate($data);

        if (empty($errors)) {
            $this->model->update($id, $data);

            // Replace all existing rules
            $this->ruleModel->deleteByBirthdayId($id);
            foreach ($daysBefore as $i => $days) {
                $this->ruleModel->create([
                    'birthday_id'  => $id,
                    'days_before'  => (int)$days,
                    'delivery_type'=> sanitize($deliveries[$i] ?? 'dashboard'),
                    'is_recurring' => $isRecurring,
                ]);
            }

            flash('success', "Birthday for \"{$data['full_name']}\" updated successfully!");
            $this->redirect('page=birthdays');
        }

        $rules = $this->ruleModel->getByBirthdayId($id);

        $this->render('birthdays/edit', [
            'birthday' => array_merge($birthday, ['id' => $id]),
            'rules'    => $rules,
            'errors'   => $errors,
            'old'      => $data,
        ]);
    }

    // ─── Delete ────────────────────────────────────────────

    public function delete(): void
    {
        $this->requirePost();
        $this->validateCsrf();

        $id       = (int)($_POST['id'] ?? 0);
        $birthday = $this->model->findById($id);

        if ($birthday) {
            $this->model->softDelete($id);
            flash('success', "Birthday for \"{$birthday['full_name']}\" has been removed.");
        } else {
            flash('error', 'Birthday record not found.', 'danger');
        }

        $this->redirect('page=birthdays');
    }

    // ─── CSV Export ────────────────────────────────────────

    public function export(): void
    {
        $birthdays = $this->model->getAllForExport();
        $filename  = 'birthdays_' . date('Ymd_His') . '.csv';

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        $out = fopen('php://output', 'w');
        // UTF-8 BOM for Excel compatibility
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Full Name', 'Date of Birth', 'Email', 'Phone', 'Custom Note', 'Created At']);

        foreach ($birthdays as $row) {
            fputcsv($out, array_values($row));
        }

        fclose($out);
        exit;
    }

    // ─── Private Helpers ───────────────────────────────────

    private function extractFormData(): array
    {
        return [
            'full_name'     => sanitize($_POST['full_name']     ?? ''),
            'date_of_birth' => sanitize($_POST['date_of_birth'] ?? ''),
            'email'         => sanitize($_POST['email']         ?? ''),
            'phone'         => sanitize($_POST['phone']         ?? ''),
            'custom_note'   => sanitize($_POST['custom_note']   ?? ''),
        ];
    }

    private function validate(array $data): array
    {
        $errors = [];

        if (empty($data['full_name'])) {
            $errors['full_name'] = 'Full name is required.';
        }

        if (empty($data['date_of_birth'])) {
            $errors['date_of_birth'] = 'Date of birth is required.';
        } elseif (!strtotime($data['date_of_birth'])) {
            $errors['date_of_birth'] = 'Invalid date format.';
        } elseif (strtotime($data['date_of_birth']) > time()) {
            $errors['date_of_birth'] = 'Date of birth cannot be in the future.';
        }

        if (empty($data['email'])) {
            $errors['email'] = 'Email address is required.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address.';
        }

        return $errors;
    }
}
