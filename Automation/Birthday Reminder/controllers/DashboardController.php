<?php
// ============================================================
// Dashboard Controller
// ============================================================

class DashboardController extends Controller
{
    public function index(): void
    {
        $birthdayModel = new Birthday();
        $reminderModel = new Reminder();
        $logModel      = new AutomationLog();

        $stats = [
            'total_birthdays'   => $birthdayModel->countAll(),
            'birthdays_today'   => $birthdayModel->countToday(),
            'upcoming_7days'    => $birthdayModel->countUpcoming(7),
            'sent_reminders'    => $reminderModel->countByStatus('sent')
                                 + $reminderModel->countByStatus('completed'),
            'failed_reminders'  => $reminderModel->countByStatus('failed'),
            'pending_reminders' => $reminderModel->countByStatus('pending'),
        ];

        $upcomingBirthdays = $birthdayModel->getUpcoming(30);
        $todayBirthdays    = $birthdayModel->getTodaysBirthdays();
        $recentReminders   = $reminderModel->getRecent(8);
        $lastCronRun       = $logModel->getLast();
        $nextBirthday      = $birthdayModel->getNextBirthday();
        $monthlyData       = $birthdayModel->getMonthlyDistribution();

        $this->render('dashboard/index', compact(
            'stats',
            'upcomingBirthdays',
            'todayBirthdays',
            'recentReminders',
            'lastCronRun',
            'nextBirthday',
            'monthlyData'
        ));
    }
}
