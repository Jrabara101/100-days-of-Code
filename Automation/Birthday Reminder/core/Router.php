<?php
// ============================================================
// Front-Controller Router
// Maps ?page=X&action=Y [METHOD] to Controller::method()
// ============================================================

class Router
{
    /**
     * Route table: [page, action, HTTP method, ControllerClass, controllerMethod]
     */
    private array $routes = [
        ['dashboard', 'index',  'GET',  'DashboardController', 'index'],

        ['birthdays', 'index',  'GET',  'BirthdayController',  'index'],
        ['birthdays', 'create', 'GET',  'BirthdayController',  'create'],
        ['birthdays', 'store',  'POST', 'BirthdayController',  'store'],
        ['birthdays', 'edit',   'GET',  'BirthdayController',  'edit'],
        ['birthdays', 'update', 'POST', 'BirthdayController',  'update'],
        ['birthdays', 'delete', 'POST', 'BirthdayController',  'delete'],
        ['birthdays', 'export', 'GET',  'BirthdayController',  'export'],

        ['reminders', 'index',  'GET',  'ReminderController',  'index'],
        ['reminders', 'mark',   'POST', 'ReminderController',  'mark'],

        ['logs',      'index',  'GET',  'LogController',       'index'],

        ['settings',  'index',  'GET',  'SettingsController',  'index'],
        ['settings',  'update', 'POST', 'SettingsController',  'update'],
    ];

    public function dispatch(): void
    {
        $page   = sanitize($_GET['page']   ?? 'dashboard');
        $action = sanitize($_GET['action'] ?? 'index');
        $method = $_SERVER['REQUEST_METHOD'];

        // Exact match on page + action + method
        foreach ($this->routes as $route) {
            if ($route[0] === $page && $route[1] === $action && $route[2] === $method) {
                (new $route[3]())->{$route[4]}();
                return;
            }
        }

        // Fallback: GET index for identified page
        foreach ($this->routes as $route) {
            if ($route[0] === $page && $route[1] === 'index' && $route[2] === 'GET') {
                (new $route[3]())->index();
                return;
            }
        }

        // Final fallback → dashboard
        (new DashboardController())->index();
    }
}
