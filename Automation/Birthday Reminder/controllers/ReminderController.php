<?php
// ============================================================
// Reminder Controller — history list + status update
// ============================================================

class ReminderController extends Controller
{
    private Reminder $model;

    public function __construct()
    {
        $this->model = new Reminder();
    }

    public function index(): void
    {
        $filters = [
            'status'        => sanitize($_GET['status']        ?? ''),
            'delivery_type' => sanitize($_GET['delivery_type'] ?? ''),
            'month'         => sanitize($_GET['month']         ?? ''),
        ];

        $reminders = $this->model->getAll($filters);

        $this->render('reminders/index', compact('reminders', 'filters'));
    }

    /** Mark a reminder with a new status (POST) */
    public function mark(): void
    {
        $this->requirePost();
        $this->validateCsrf();

        $id     = (int)($_POST['id']     ?? 0);
        $status = sanitize($_POST['status'] ?? 'completed');

        $allowed = ['pending', 'sent', 'failed', 'completed'];
        if (!in_array($status, $allowed, true)) {
            $status = 'completed';
        }

        $this->model->updateStatus($id, $status, date('Y-m-d H:i:s'));
        flash('success', 'Reminder status updated to "' . ucfirst($status) . '".');
        $this->redirect('page=reminders');
    }
}
