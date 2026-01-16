<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Reminder;
use Carbon\Carbon;

class DispatchReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chronos:dispatch-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and dispatch pending reminders for the Chronos scheduler';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        
        // Fetch reminders due now or in the past that haven't been sent
        $reminders = Reminder::where('is_sent', false)
            ->where('reminder_time', '<=', $now)
            ->with('task')
            ->get();

        if ($reminders->isEmpty()) {
            $this->info('No pending reminders found.');
            return;
        }

        foreach ($reminders as $reminder) {
            // In a real app, we would fire an event here.
            // Event::dispatch(new ReminderTriggered($reminder));
            
            $this->info("Dispatching reminder for Task #{$reminder->task_id}: {$reminder->task->title}");
            
            // Mark as sent
            $reminder->update(['is_sent' => true]);
        }
        
        $this->info("Dispatched {$reminders->count()} reminders.");
    }
}
