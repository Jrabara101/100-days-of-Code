<?php

require_once __DIR__ . '/CliUI.php';
require_once __DIR__ . '/SubmissionStore.php';

class App
{
    private CliUI $ui;
    private SubmissionStore $store;

    public function __construct(string $dataPath)
    {
        $this->ui = new CliUI();
        $this->store = new SubmissionStore($dataPath);
    }

    public function run(): void
    {
        while (true) {
            $this->ui->renderBanner();
            $this->ui->renderMenu();

            $choice = $this->ui->prompt("Enter your choice");

            switch ($choice) {
                case '1':
                    $this->addSubmission();
                    break;
                case '2':
                    $this->listSubmissions();
                    break;
                case '3':
                    $this->searchSubmission();
                    break;
                case '4':
                    $this->editSubmission();
                    break;
                case '5':
                    $this->deleteSubmission();
                    break;
                case '6':
                    $this->exportToCsv();
                    break;
                case '0':
                    $this->ui->info("Exiting Contact Form Saver. Goodbye!");
                    exit(0);
                default:
                    $this->ui->error("Invalid choice. Please try again.");
                    $this->ui->pause();
            }
        }
    }

    private function addSubmission(): void
    {
        $this->ui->title("Add Contact Form Submission");

        $name = $this->ui->prompt("Name (required)");
        if (trim($name) === '') {
            $this->ui->error("Name cannot be empty. Aborting.");
            $this->ui->pause();
            return;
        }

        $email = $this->ui->prompt("Email (required)");
        $phone = $this->ui->prompt("Phone (optional, press Enter to skip)");
        $subject = $this->ui->prompt("Subject (required)");
        $message = $this->ui->prompt("Message (required)");

        $submission = new Submission(
            $name,
            $email,
            $subject,
            $message,
            $phone !== '' ? $phone : null
        );

        $errors = $submission->validate();

        if (!empty($errors)) {
            $this->ui->error("Validation failed:");
            foreach ($errors as $error) {
                echo "  - $error\n";
            }
            $this->ui->pause();
            return;
        }

        $this->ui->simulatedLoading("Saving contact submission");

        if ($this->store->save($submission)) {
            $this->ui->ok("Submission saved successfully!");
        } else {
            $this->ui->error("Failed to save submission to file.");
        }

        $this->ui->pause();
    }

    private function listSubmissions(): void
    {
        $this->ui->title("All Submissions");
        $submissions = $this->store->getAll();
        
        $this->ui->renderTable($submissions);
        $this->ui->pause();
    }

    private function searchSubmission(): void
    {
        $this->ui->title("Search Submission");
        $keyword = $this->ui->prompt("Enter keyword to search (name, email, subject, message)");

        if (trim($keyword) === '') {
            $this->ui->warning("Keyword cannot be empty.");
            $this->ui->pause();
            return;
        }

        $this->ui->simulatedLoading("Searching", 3, 150000);
        $results = $this->store->search($keyword);

        $this->ui->info("Found " . count($results) . " result(s):");
        $this->ui->renderTable($results);
        $this->ui->pause();
    }

    private function editSubmission(): void
    {
        $this->ui->title("Edit Submission");
        $id = $this->ui->prompt("Enter ID of the submission to edit");

        $submission = $this->store->getById($id);

        if (!$submission) {
            $this->ui->error("Submission with ID '$id' not found.");
            $this->ui->pause();
            return;
        }

        $this->ui->info("Current Data:");
        $this->ui->renderSingleSubmission($submission);
        echo "\nLeave field blank to keep current value.\n\n";

        $updates = [];
        
        $name = $this->ui->prompt("New Name [{$submission->name}]");
        if ($name !== '') $updates['name'] = $name;

        $email = $this->ui->prompt("New Email [{$submission->email}]");
        if ($email !== '') $updates['email'] = $email;

        $phoneLabel = $submission->phone ?? 'N/A';
        $phone = $this->ui->prompt("New Phone [$phoneLabel]");
        if ($phone !== '') $updates['phone'] = $phone;

        $subject = $this->ui->prompt("New Subject [{$submission->subject}]");
        if ($subject !== '') $updates['subject'] = $subject;

        $message = $this->ui->prompt("New Message [Press enter to keep current part]");
        if ($message !== '') $updates['message'] = $message;

        if (empty($updates)) {
            $this->ui->info("No changes made.");
            $this->ui->pause();
            return;
        }

        // Clone for validation preview
        $preview = clone $submission;
        $preview->update($updates);
        $errors = $preview->validate();

        if (!empty($errors)) {
            $this->ui->error("Validation failed for new data:");
            foreach ($errors as $error) {
                echo "  - $error\n";
            }
            $this->ui->pause();
            return;
        }

        if ($this->ui->confirm("Are you sure you want to save these changes?")) {
            $this->ui->simulatedLoading("Updating submission");
            
            // Actually update
            $submission->update($updates);
            if ($this->store->update($submission)) {
                $this->ui->ok("Submission updated successfully!");
            } else {
                $this->ui->error("Failed to write to storage.");
            }
        } else {
            $this->ui->info("Update cancelled.");
        }

        $this->ui->pause();
    }

    private function deleteSubmission(): void
    {
        $this->ui->title("Delete Submission");
        $id = $this->ui->prompt("Enter ID of the submission to delete");

        $submission = $this->store->getById($id);

        if (!$submission) {
            $this->ui->error("Submission with ID '$id' not found.");
            $this->ui->pause();
            return;
        }

        $this->ui->renderSingleSubmission($submission);

        if ($this->ui->confirm("Are you SURE you want to delete this submission? This cannot be undone.")) {
            $this->ui->simulatedLoading("Deleting");
            if ($this->store->delete($id)) {
                $this->ui->ok("Submission deleted successfully!");
            } else {
                $this->ui->error("Failed to delete submission.");
            }
        } else {
            $this->ui->info("Deletion cancelled.");
        }

        $this->ui->pause();
    }

    private function exportToCsv(): void
    {
        $this->ui->title("Export to CSV");
        $filename = $this->ui->prompt("Enter filename for export (e.g., exports.csv) [default: exports.csv]");
        
        if (trim($filename) === '') {
            $filename = 'exports.csv';
        }
        
        $filePath = dirname($this->store->getAll()[0] ?? __DIR__) . '/../' . $filename; // Saves to root

        // Fix path
        $baseDir = realpath(__DIR__ . '/..');
        $savePath = $baseDir . DIRECTORY_SEPARATOR . basename($filename);


        $this->ui->simulatedLoading("Exporting data");
        $count = $this->store->exportToCsv($savePath);

        if ($count !== false) {
            $this->ui->ok("Successfully exported $count record(s) to " . basename($filename));
        } else {
            $this->ui->error("Failed to export data. Please check permissions.");
        }

        $this->ui->pause();
    }
}
