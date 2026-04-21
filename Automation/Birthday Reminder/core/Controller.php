<?php
// ============================================================
// Base Controller — render, redirect, json helpers
// ============================================================

abstract class Controller
{
    /**
     * Render a view file wrapped in layout header + footer.
     * Variables in $data are extracted into view scope.
     */
    protected function render(string $view, array $data = []): void
    {
        extract($data, EXTR_SKIP);

        $viewFile = ROOT_PATH . '/views/' . $view . '.php';
        if (!file_exists($viewFile)) {
            die("View not found: {$view}");
        }

        require ROOT_PATH . '/views/layouts/header.php';
        require $viewFile;
        require ROOT_PATH . '/views/layouts/footer.php';
    }

    /** Redirect to a URL constructed with the url() helper */
    protected function redirect(string $queryString = ''): void
    {
        header('Location: ' . url($queryString));
        exit;
    }

    /** Output a JSON response and exit */
    protected function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /** Enforce POST method — redirect to dashboard on GET */
    protected function requirePost(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('page=dashboard');
        }
    }

    /** Validate CSRF token from POST; abort with flash on failure */
    protected function validateCsrf(): void
    {
        $token = $_POST['csrf_token'] ?? '';
        if (!verify_csrf($token)) {
            flash('error', 'Security token mismatch. Please try again.', 'danger');
            header('Location: ' . ($_SERVER['HTTP_REFERER'] ?? url('page=dashboard')));
            exit;
        }
    }
}
