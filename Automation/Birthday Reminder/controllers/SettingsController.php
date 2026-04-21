<?php
// ============================================================
// Settings Controller
// ============================================================

class SettingsController extends Controller
{
    public function index(): void
    {
        $this->render('settings/index', [
            'db_host'    => DB_HOST,
            'db_name'    => DB_NAME,
            'db_user'    => DB_USER,
            'timezone'   => TIMEZONE,
            'base_url'   => BASE_URL,
            'app_version'=> APP_VERSION,
        ]);
    }

    public function update(): void
    {
        $this->requirePost();
        $this->validateCsrf();

        // Settings are file-based (config/app.php, config/database.php).
        // Provide guidance rather than dynamic file editing for security.
        flash(
            'success',
            'To apply changes, edit <code>config/app.php</code> and '
            . '<code>config/database.php</code> directly on the server.'
        );

        $this->redirect('page=settings');
    }
}
