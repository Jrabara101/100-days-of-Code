<?php

namespace App\Notifications;

use App\Models\ScanSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\SlackMessage;
use Illuminate\Notifications\Notification;

class BrokenLinksFound extends Notification
{
    use Queueable;

    public function __construct(
        private ScanSession $session
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = [];

        if (config('linkchecker.notify_email')) {
            $channels[] = 'mail';
        }

        if (config('linkchecker.notify_slack')) {
            $channels[] = 'slack';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $broken  = $this->session->broken_count;
        $baseUrl = $this->session->base_url;

        $mail = (new MailMessage())
            ->subject("⚠️ {$broken} Broken Link(s) Found on {$baseUrl}")
            ->greeting("Broken Links Detected!")
            ->line("Your link checker scan for **{$baseUrl}** found **{$broken} broken link(s)**.")
            ->line('**Session Summary:**')
            ->line("- Session ID: #{$this->session->id}")
            ->line("- Total Links Scanned: {$this->session->total_links}")
            ->line("- Broken Links: {$broken}")
            ->line("- Scan Completed: {$this->session->completed_at?->format('Y-m-d H:i:s')}")
            ->line('---')
            ->line('**Broken Links (by source page):**');

        // List first 20 broken links
        $brokenLinks = $this->session
            ->linkResults()
            ->where('is_broken', true)
            ->take(20)
            ->get();

        foreach ($brokenLinks as $link) {
            $status = $link->status_code ?? 'ERR';
            $mail->line("- [{$status}] {$link->url} (found on: {$link->source_page})");
        }

        if ($broken > 20) {
            $mail->line("... and " . ($broken - 20) . " more.");
        }

        return $mail->line('Run `php artisan links:report --latest` for the full report.');
    }

    /**
     * Get the Slack representation of the notification.
     */
    public function toSlack(object $notifiable): array
    {
        $broken  = $this->session->broken_count;
        $baseUrl = $this->session->base_url;

        // Slack Incoming Webhook payload format
        $text = "⚠️ *Broken Links Detected* — {$broken} broken link(s) found on <{$baseUrl}|{$baseUrl}>\n";
        $text .= ">Session #{$this->session->id} | Total: {$this->session->total_links} | Broken: {$broken}\n";

        $brokenLinks = $this->session
            ->linkResults()
            ->where('is_broken', true)
            ->take(10)
            ->get();

        foreach ($brokenLinks as $link) {
            $status = $link->status_code ?? 'ERR';
            $text .= "> [{$status}] {$link->url}\n";
        }

        if ($broken > 10) {
            $text .= "> ... and " . ($broken - 10) . " more.";
        }

        return ['text' => $text];
    }
}
