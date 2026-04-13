<?php

namespace App\Core;

use App\Services\NoteService;
use App\UI\CliRenderer;
use App\UI\CliInput;
use App\Helpers\Color;
use Exception;

/**
 * Routes CLI commands to logical actions
 */
class CommandRouter
{
    private NoteService $noteService;
    private CliRenderer $renderer;

    public function __construct(NoteService $noteService, CliRenderer $renderer)
    {
        $this->noteService = $noteService;
        $this->renderer = $renderer;
    }

    public function run(array $argv): void
    {
        $command = $argv[1] ?? 'menu';

        try {
            switch ($command) {
                case 'note:create':
                    $this->createAction();
                    break;
                case 'note:list':
                    $this->listAction($argv);
                    break;
                case 'note:view':
                    $this->viewAction($argv);
                    break;
                case 'note:edit':
                    $this->editAction($argv);
                    break;
                case 'note:trash':
                    $this->trashAction($argv);
                    break;
                case 'note:undo':
                    $this->undoAction();
                    break;
                case 'note:restore':
                    $this->restoreAction($argv);
                    break;
                case 'note:search':
                    $this->searchAction($argv);
                    break;
                case 'note:pin':
                    $this->pinAction($argv);
                    break;
                case 'note:fav':
                    $this->favAction($argv);
                    break;
                case 'note:archive':
                    $this->archiveAction($argv);
                    break;
                case 'stats':
                    $this->statsAction();
                    break;
                case 'help':
                    $this->helpAction();
                    break;
                case 'menu':
                default:
                    $this->interactiveMenu();
                    break;
            }
        } catch (Exception $e) {
            echo Color::error("Error: " . $e->getMessage()) . PHP_EOL;
        }
    }

    private function interactiveMenu(): void
    {
        while (true) {
            $stats = $this->noteService->getStats();
            $latest = $this->noteService->listNotes(['status' => 'active'], 'latest');
            $this->renderer->dashboard($stats, array_slice($latest, 0, 5));

            echo PHP_EOL . Color::bold("MENU:") . PHP_EOL;
            echo "1. Create Note    2. List Notes    3. Search    4. View Note" . PHP_EOL;
            echo "5. Archive/Trash  6. Stats         7. Help      8. Exit" . PHP_EOL;
            
            $choice = CliInput::read("Select option: ");

            switch ($choice) {
                case '1': $this->createAction(); break;
                case '2': $this->listAction([]); break;
                case '3': $this->searchAction([]); break;
                case '4': 
                    $id = (int)CliInput::read("Enter Note ID: ");
                    $this->viewAction([null, null, $id]); 
                    break;
                case '5': $this->trashAction([]); break;
                case '6': $this->statsAction(); break;
                case '7': $this->helpAction(); break;
                case '8': case 'exit': case 'q': exit;
                default: echo Color::warning("Invalid option.") . PHP_EOL; sleep(1);
            }
        }
    }

    private function createAction(): void
    {
        $this->renderer->header("Create New Note");
        $title = CliInput::read("Title: ", true);
        $category = CliInput::read("Category (General): ") ?: "General";
        $tagsInput = CliInput::read("Tags (comma separated): ");
        $tags = $tagsInput ? array_map('trim', explode(',', $tagsInput)) : [];
        $content = CliInput::readMultiLine();

        $note = $this->noteService->createNote($title, $content, $tags, $category);
        echo Color::success("Note created successfully! ID: {$note->id}") . PHP_EOL;
        sleep(1);
    }

    private function listAction(array $args): void
    {
        $status = $args[2] ?? 'active';
        $notes = $this->noteService->listNotes(['status' => $status]);
        
        $this->renderer->header("Notes List (" . strtoupper($status) . ")");
        if (empty($notes)) {
            echo Color::apply("No notes found.", Color::GRAY) . PHP_EOL;
        } else {
            foreach ($notes as $note) {
                $p = $note->pinned ? "[P]" : "   ";
                echo sprintf("[%2d] %s %-40s | %s", $note->id, $p, $note->title, $note->created_at) . PHP_EOL;
            }
        }
        CliInput::read("Press Enter to continue...");
    }

    private function viewAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to view: "));
        $note = $this->noteService->getNote($id);
        $this->renderer->clear();
        $this->renderer->renderNote($note);
        CliInput::read("Press Enter to return...");
    }

    private function pinAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to toggle pin: "));
        $note = $this->noteService->getNote($id);
        $this->noteService->updateNote($id, ['pinned' => !$note->pinned]);
        $status = !$note->pinned ? "pinned" : "unpinned";
        echo Color::success("Note #{$id} {$status} successfully.") . PHP_EOL;
        sleep(1);
    }

    private function favAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to toggle favorite: "));
        $note = $this->noteService->getNote($id);
        $this->noteService->updateNote($id, ['favorite' => !$note->favorite]);
        $status = !$note->favorite ? "marked as favorite" : "removed from favorites";
        echo Color::success("Note #{$id} {$status} successfully.") . PHP_EOL;
        sleep(1);
    }

    private function archiveAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to toggle archive: "));
        $note = $this->noteService->getNote($id);
        $newStatus = $note->status === 'archived' ? 'active' : 'archived';
        $this->noteService->updateNote($id, ['status' => $newStatus]);
        echo Color::success("Note #{$id} moved to {$newStatus}.") . PHP_EOL;
        sleep(1);
    }

    private function trashAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to move to trash: "));
        if (CliInput::confirm("Move note #{$id} to trash?")) {
            $this->noteService->trashNote($id);
            echo Color::success("Note moved to trash. (Use 'note:undo' to bring it back)") . PHP_EOL;
        }
        sleep(1);
    }

    private function undoAction(): void
    {
        $note = $this->noteService->undoTrash();
        if ($note) {
            echo Color::success("Note #{$note->id} has been restored!") . PHP_EOL;
        } else {
            echo Color::warning("Nothing to undo.") . PHP_EOL;
        }
        sleep(1);
    }

    private function restoreAction(array $args): void
    {
        $id = (int)($args[2] ?? CliInput::read("Enter ID to restore: "));
        $this->noteService->restoreNote($id);
        echo Color::success("Note restored.") . PHP_EOL;
        sleep(1);
    }

    private function searchAction(array $args): void
    {
        $keyword = $args[2] ?? CliInput::read("Enter keyword: ");
        $results = $this->noteService->listNotes([]);
        $filtered = [];
        foreach ($results as $note) {
            if (str_contains(strtolower($note->title), strtolower($keyword)) || str_contains(strtolower($note->content), strtolower($keyword))) {
                $filtered[] = $note;
            }
        }

        $this->renderer->header("Search Results for: '$keyword'");
        foreach ($filtered as $note) {
            echo sprintf("[%2d] %-40s | %s", $note->id, $note->title, $note->status) . PHP_EOL;
        }
        CliInput::read("Press Enter to continue...");
    }

    private function statsAction(): void
    {
        $stats = $this->noteService->getStats();
        $this->renderer->header("Detailed Statistics");
        foreach ($stats as $key => $value) {
            echo Color::apply(ucfirst($key), Color::CYAN) . ": " . $value . PHP_EOL;
        }
        CliInput::read("Press Enter to continue...");
    }

    private function helpAction(): void
    {
        $this->renderer->header("Help & Command List");
        echo Color::info("COMMAND MODE:") . PHP_EOL;
        echo "  php index.php note:create        Create a new note" . PHP_EOL;
        echo "  php index.php note:list [status] List notes (active/archived/trashed)" . PHP_EOL;
        echo "  php index.php note:view [id]     View a specific note" . PHP_EOL;
        echo "  php index.php note:trash [id]    Move a note to trash" . PHP_EOL;
        echo "  php index.php note:restore [id]  Restore a note from trash" . PHP_EOL;
        echo "  php index.php note:search [key]  Search notes" . PHP_EOL;
        echo "  php index.php stats              Show summary stats" . PHP_EOL;
        echo PHP_EOL . Color::info("INTERACTIVE MODE:") . PHP_EOL;
        echo "  php index.php                    Launch the visual menu" . PHP_EOL;
        CliInput::read("Press Enter to continue...");
    }
}
