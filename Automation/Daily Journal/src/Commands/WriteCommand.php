<?php

declare(strict_types=1);

namespace ChronoVault\Commands;

use ChronoVault\Domain\JournalEntryDraft;
use ChronoVault\Domain\Mood;
use ChronoVault\Storage\JournalRepositoryInterface;
use ChronoVault\System\EditorProcess;
use ChronoVault\Terminal\TerminalUI;

/**
 * WriteCommand — Orchestrates the full journal entry creation workflow.
 *
 * Workflow:
 *   1. Show a "compose" banner in the terminal
 *   2. Hand over control to $EDITOR via EditorProcess::openAndCapture()
 *   3. If the user wrote nothing, abort gracefully
 *   4. Prompt for mood score (1–5) and optional tags
 *   5. Pass the draft to the EncryptedJournalRepository for encryption + storage
 *   6. Display a confirmation with entry stats
 */
class WriteCommand implements CommandInterface
{
    public function __construct(
        private readonly JournalRepositoryInterface $repository,
        private readonly EditorProcess              $editor,
        private readonly TerminalUI                 $ui,
    ) {}

    public function getName(): string
    {
        return 'write';
    }

    public function getDescription(): string
    {
        return 'Open your $EDITOR to compose and encrypt a new journal entry';
    }

    public function execute(array $args): int
    {
        $this->ui->writeHeader();

        // Build a helpful template for the user to see in the editor.
        $date     = date('l, F j, Y');
        $template = <<<TEMPLATE
        # Journal Entry — {$date}
        # Lines beginning with # are comments and will be stripped.
        # Write your entry below this line.
        # ─────────────────────────────────────────────

        TEMPLATE;

        // Normalize the template indentation
        $template = preg_replace('/^        /m', '', $template);

        $this->ui->info('Opening your editor... (save and close to continue)');
        $this->ui->newLine();

        try {
            $rawBody = $this->editor->openAndCapture($template);
        } catch (\RuntimeException $e) {
            $this->ui->error($e->getMessage());
            return 1;
        }

        // Strip comment lines (lines starting with #) from the body.
        $lines    = explode("\n", $rawBody);
        $filtered = array_filter($lines, fn(string $l) => !str_starts_with(ltrim($l), '#'));
        $body     = trim(implode("\n", $filtered));

        if ($body === '') {
            $this->ui->warning('No content written. Entry discarded.');
            return 0;
        }

        $draft       = new JournalEntryDraft();
        $draft->body = $body;

        // Prompt for mood.
        $moodScore   = $this->ui->promptMood();
        $draft->mood = Mood::fromScore($moodScore);

        // Prompt for tags.
        $tagInput = $this->ui->prompt(
            "\e[38;5;147m  Tags \e[0m\e[38;5;245m(space-separated, e.g. #focus #work) [Enter to skip]:\e[0m "
        );
        if (trim($tagInput) !== '') {
            $draft->setTagsFromString($tagInput);
        }

        // Persist (encrypt + save).
        try {
            $entry = $this->repository->save($draft);
        } catch (\RuntimeException $e) {
            $this->ui->error("Failed to save entry: {$e->getMessage()}");
            return 1;
        }

        $this->ui->newLine();
        $this->ui->successBanner($entry);

        return 0;
    }
}
