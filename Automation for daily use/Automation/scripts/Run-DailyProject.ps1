param(
    [string]$RepoPath = "C:\Users\Admin\100-days-of-Code"
)

$ErrorActionPreference = "Stop"
Set-Location $RepoPath

$autoDir = Join-Path $RepoPath "Automation for daily use\Automation"
$logDir  = Join-Path $autoDir ".logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile   = Join-Path $logDir "run_$timestamp.log"

Start-Transcript -Path $logFile -Append
Write-Host "=== Daily PHP Automation Project run: $timestamp ===" -ForegroundColor Cyan

function Get-ProjectFolders {
    Get-ChildItem $autoDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{3}-' } |
        Select-Object -ExpandProperty Name
}

$before = @(Get-ProjectFolders)

$prompt = @'
This repo tracks a personal "100 automation projects" checklist inside the file
`Automation for daily use/Automation/Automation PHP and Laravel.docx`. It's a Word
.docx (a zip of XML). Completed items have their text run colored red via
`<w:color w:val="EE0000"/>` in `word/document.xml`; incomplete items have no color
override. The list is a single ordered Word numbering list (numId 15) that runs from
item #1 through #100, organized in named sections in the doc ("Easy Projects (1-35)",
"Lower-Medium Projects (36-60)", "Medium Projects (61-80)", and further sections you'll
find by reading the doc) - each section header and each "Skills gained here" sub-list
are separate, non-numbered paragraphs interleaved between the numbered project items,
so don't confuse them for checklist items.

This is a LOCAL run on the user's own Windows machine (not a cloud sandbox). PHP 8.4 is
already installed and on PATH (`php -v` works). Git is already configured with a working
origin remote on branch main.

Do the following, in order, and stop after completing exactly ONE checklist item (do not
cascade to a second item in this run):

1. Unzip the docx (e.g. `unzip "Automation for daily use/Automation/Automation PHP and Laravel.docx" -d /tmp/docx_extract` from Git Bash, or use Python's zipfile module) and read
   `word/document.xml`. Parse it paragraph by paragraph (`<w:p ...>...</w:p>`) to reconstruct
   the ordered list of 100 project-item paragraphs (skip section headers and "Skills gained
   here" sub-bullets - those are not numbered checklist items), and determine which ones
   already have `EE0000` color (completed) vs not. Find the LOWEST-numbered item that is NOT
   yet colored red - that is today's target item. If all 100 items are already red, do
   nothing further and just report that the checklist is fully complete.

2. Look at `Automation for daily use/Automation/066-payment-status-sync-api/script.php` and
   `prompt.md` in this repo - that's the reference example from item #66, already completed,
   showing the expected style and structure (PHP 8 with `declare(strict_types=1)`, small
   focused classes modeling the domain, a `TransientXxxException`-style distinction between
   retryable and non-retryable failures where relevant, real decision/reasoning logic specific
   to the project's problem domain - not generic boilerplate - and a styled terminal UI: ANSI
   colors, a boxed banner, a rendered table, and a summary line).

3. Apply this senior-developer prompt template to today's target item's project name (call
   the resulting project name "X"): "Create a PHP Command CLI with advanced senior developer
   prompt to generate more visual styling layout and more reasoning logic behind the code.
   for using PHP" - applied to project X. Design and write a real, runnable, self-contained
   PHP CLI script implementing project X, matching the quality bar and style of the #66
   reference (senior-level class/domain modeling, genuine reasoning logic appropriate to that
   specific project's problem - e.g. retry/backoff, state-transition validation, conflict/dedup
   detection, whatever fits the project - plus a rich styled terminal report). Do not just
   reuse the #66 domain - model the actual domain implied by today's project name.

4. Create a new folder `Automation for daily use/Automation/0NN-slug-of-project-name/`
   (zero-padded 3-digit item number, kebab-case slug derived from the project name, following
   the same naming convention as `066-payment-status-sync-api`). Put the script at
   `script.php` inside it.

5. Run `php script.php` from inside that folder, capture its full stdout (including ANSI
   escape codes) into `run_output.txt` in the project folder, and also inline a plain-text
   (or fenced code block) copy of that output into `prompt.md`.

6. Write `prompt.md` in the project folder containing: the exact senior prompt used (from
   step 3, with the project name substituted in), a short "Design reasoning" section
   explaining the specific non-obvious decisions in the code (why this retry/validation/
   reconciliation approach fits this project's domain), a "Files" section, and the captured
   CLI output.

7. Edit `word/document.xml` to mark today's target item's paragraph as complete: add
   `<w:rPr><w:color w:val="EE0000"/></w:rPr>` inside its `<w:pPr>` (right after the
   `</w:numPr>` close), and add `<w:rPr><w:color w:val="EE0000"/></w:rPr>` as the first
   child inside its `<w:r ...>` run (right before the `<w:t>` element), matching exactly the
   pattern already used on the other completed items (look at item #66's paragraph, whose
   paraId is `66CCD9D1`, as your template for exactly how the color tags are nested). Do NOT
   touch any other paragraph's markup.

8. Re-zip the extracted directory back into a valid .docx (a docx is just a standard zip
   archive containing `[Content_Types].xml` at its root alongside `_rels/`, `docProps/`, and
   `word/` - e.g. using Python's `zipfile` module, walking the extracted directory and writing
   each file back with its relative path as the zip arcname; do not use a naive `zip -r` from
   inside the wrong directory, since that would nest a subfolder instead of putting
   `[Content_Types].xml` at the zip root). Overwrite
   `Automation for daily use/Automation/Automation PHP and Laravel.docx` with this new zip.

9. Sanity-check your edit before finishing: re-extract the new docx you just wrote and confirm
   (a) the total paragraph count in `word/document.xml` is unchanged from before your edit,
   (b) today's target item's paragraph now contains `EE0000`, and (c) no other paragraph's
   text or color changed. If anything looks wrong, stop and leave the original docx untouched
   (don't commit a broken edit) - report the problem instead.

10. Before editing the docx, check whether a Word lock file (a file named `~$...docx`) exists
    next to it - if so, Word likely has it open. In that case, still do steps 1-6 (build and
    run the project), but SKIP steps 7-9 (don't touch the docx), and clearly note in prompt.md
    that marking item complete in the docx is pending until Word is closed, then re-run this
    task.

11. Commit all new/changed files (the new project folder, and the updated docx if you edited
    it) with a concise commit message naming the item number and project name, and push to
    `main` on origin. Do not amend or force-push. If the push is rejected because origin has
    moved on, `git pull --rebase` once and retry; if it still fails, stop and report rather
    than force-pushing.

At the end, print a short final line in exactly this format so a wrapper script can parse it:
DONE_FOLDER: <the folder name you created, e.g. 067-inventory-sync-supplier-api>
(or `DONE_FOLDER: NONE` if the checklist was already fully complete, or if you stopped early
due to an error).
'@

Write-Host "Invoking Claude Code to generate today's project..." -ForegroundColor Yellow

& claude -p $prompt --allowedTools "Bash Read Write Edit Glob Grep" --dangerously-skip-permissions

$after = @(Get-ProjectFolders)
$new = @($after | Where-Object { $before -notcontains $_ })

if ($new.Count -eq 0) {
    Write-Host ""
    Write-Host "No new project folder was created this run (checklist may already be complete, or the run failed). Check the transcript above." -ForegroundColor Yellow
    Stop-Transcript
    exit 1
}

foreach ($folderName in $new) {
    $folder = Join-Path $autoDir $folderName
    $scriptPath = Join-Path $folder "script.php"

    Write-Host ""
    Write-Host "=== Showing CLI output for $folderName ===" -ForegroundColor Green

    if (Test-Path $scriptPath) {
        Push-Location $folder
        php script.php
        Pop-Location
    }
    else {
        Write-Host "script.php not found in $folder" -ForegroundColor Red
    }
}

Stop-Transcript
