param(
    [string]$RepoPath   = "C:\Users\Admin\100-days-of-Code",
    [string]$JavaFxLib  = "C:\tools\javafx-sdk-26.0.1\lib"
)

$ErrorActionPreference = "Stop"
Set-Location $RepoPath

$javaGuiDir = Join-Path $RepoPath "Automation for daily use\JAVA GUI"
$logDir     = Join-Path $javaGuiDir ".logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile   = Join-Path $logDir "run_$timestamp.log"

Start-Transcript -Path $logFile -Append
Write-Host "=== Daily JavaFX GUI Project run: $timestamp ===" -ForegroundColor Cyan

function Get-ProjectFolders {
    Get-ChildItem $javaGuiDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{3}-' } |
        Select-Object -ExpandProperty Name
}

$before = @(Get-ProjectFolders)

$prompt = @'
This repo tracks a personal "100 Java GUI projects" checklist inside the file
`Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx`.
It's a Word .docx (a zip of XML). Completed items have their title run colored red via
`<w:color w:val="EE0000"/>` inside the run's `<w:rPr>` in `word/document.xml`; incomplete
items have no color override. Unlike a numbered Word list, these project-item paragraphs
are plain (non-numbered) paragraphs - the section headers ("Beginner Java GUI Projects 1
33", "Intermediate Java GUI Projects 34 66", "Advanced Java GUI Projects 67 100") tell you
the intended numeric ranges, and "Key Skills Learned" paragraphs plus the section
descriptions are notes, not checklist items - skip those when walking the list. Some
project titles have a trailing superscript citation number (e.g. "Video Conferencing App
Java + WebRTC 2", "Group Chat App (multithreading, database) 6 3") baked into a *separate*
run right after the title's own run - that trailing number is a research-footnote marker,
NOT part of the project name and NOT part of the numbering scheme - strip it when deriving
the project name/slug, and do not color that citation run when marking an item done (only
color the title run itself, matching the pattern already used on completed items).

This is a LOCAL run on the user's own Windows machine (not a cloud sandbox). OpenJDK 25 is
installed and on PATH (`java -version` / `javac -version` work). The JavaFX SDK is installed
locally at: $JavaFxLib (module jars: javafx.base.jar, javafx.controls.jar, javafx.graphics.jar,
javafx.fxml.jar, etc.) Git is already configured with a working origin remote on branch main.

Do the following, in order, and stop after completing exactly ONE checklist item (do not
cascade to a second item in this run):

1. Unzip the docx (e.g. `unzip "Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx" -d /tmp/javagui_extract` from Git Bash, or use Python's zipfile
   module) and read `word/document.xml`. Parse it paragraph by paragraph (`<w:p ...>...</w:p>`)
   to reconstruct the ordered list of project-item paragraphs (skipping section headers,
   section description notes, and "Key Skills Learned" paragraphs as described above), and
   determine which ones already have `EE0000` on their title run (completed) vs not. Find the
   FIRST one (in document order) that is NOT yet colored red - that is today's target item.
   If every project-item paragraph is already red, do nothing further and report the
   checklist is fully complete.

2. Look at `Automation for daily use/JAVA GUI/067-video-conferencing-app-webrtc/` in this repo
   (both the `src/*.java` files and `prompt.md`) - that's the reference example from item #67,
   already completed, showing the expected style and structure: OpenJDK JavaFX, one focused
   class per file (state enums, an observable domain model using JavaFX properties, a checked-
   exception hierarchy distinguishing transient/retryable failures from terminal/non-retryable
   ones where the project has any kind of negotiation/connection/sync step, a small class
   encoding a genuine UI/domain reasoning decision like a layout algorithm, and a JavaFX
   `Application` subclass with a dark-themed, styled Scene using inline `-fx-` CSS).

3. Apply this senior-developer prompt template to today's target item's project name (call the
   resulting project name "X", with any trailing citation number already stripped): "create a
   JavaFX GUI with advanced senior developer prompt to generate more visual styling layout and
   more reasoning logic behind the code." - applied to project X. Design and write a real,
   compilable, self-contained JavaFX project implementing project X, matching the quality bar
   and structure of the #67 reference (senior-level class-per-file domain modeling, genuine
   reasoning logic specific to project X's actual problem domain - not generic boilerplate, and
   not just a copy of the video-conferencing domain - plus a rich, styled JavaFX UI: a dark or
   otherwise deliberate color scheme, sensible layout containers, and visual state feedback).
   Where project X has no obvious network/negotiation step, apply the "genuine reasoning logic"
   requirement to whatever domain problem *is* central to it instead (e.g. a validation/parsing
   algorithm, a scheduling/conflict-resolution rule, a data-consistency check) - don't force a
   retry/backoff pattern where it doesn't fit.

4. Create a new folder `Automation for daily use/JAVA GUI/0NN-slug-of-project-name/src/`
   (zero-padded 3-digit item number, kebab-case slug derived from the project name, following
   the same naming convention as `067-video-conferencing-app-webrtc`). Put the `.java` source
   files inside `src/`.

5. Compile the project against the local JavaFX SDK:
   `javac --module-path "$JavaFxLib" --add-modules javafx.controls,javafx.graphics,javafx.base,javafx.fxml -d out src/*.java`
   (add other javafx modules from the list above only if the project actually needs them, e.g.
   javafx.media for audio/video projects). Do NOT attempt to run/launch the compiled JavaFX
   application (`java ... <MainClass>`) - even without calling `Application.launch()`, merely
   touching javafx.graphics classes has been observed to start a non-daemon native toolkit
   thread that never exits on this machine, which would hang this unattended run indefinitely.
   Compiling is the full verification step for this pipeline; do not skip it, and do not run it.

6. If compilation fails, fix the code and recompile until it succeeds (or, if truly stuck after
   reasonable effort, stop and report the compiler error rather than committing broken code).

7. Write `prompt.md` in the project folder containing: the exact senior prompt used (from step
   3, with the project name substituted in), a "Design reasoning" section explaining the
   specific non-obvious decisions in the code and why they fit project X's actual domain, a
   "Files" section listing each `.java` file with a one-line purpose, the exact `javac` compile
   command used and its result ("compiled cleanly, 0 errors" or similar), and a short ASCII/text
   "Layout summary" sketch of the UI (panels/controls/regions) in place of a screenshot, since
   no window is ever launched in this pipeline.

8. Edit `word/document.xml` to mark today's target item's paragraph as complete: find its
   title run's `<w:rPr>...</w:rPr>` and insert `<w:color w:val="EE0000"/>` into it (matching
   the exact pattern already used on other completed items - look at item #67's paragraph,
   paraId `6E707600`, as your template). If the title text and a trailing citation-number run
   are split into two separate `<w:r>` elements in the same `<w:p>` (as with #67), only color
   the title run's `<w:rPr>`, not the citation run's. Do NOT touch any other paragraph's
   markup.

9. Re-zip the extracted directory back into a valid .docx (a docx is a standard zip archive
   with `[Content_Types].xml` at its root alongside `_rels/`, `docProps/`, `word/`, etc. - use
   Python's `zipfile` module, walking the extracted directory and writing each file back with
   its relative path as the arcname; do not use a naive `zip -r` from the wrong directory, which
   would nest a subfolder instead of putting `[Content_Types].xml` at the zip root). Overwrite
   `Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx`
   with this new zip.

10. Sanity-check your edit before finishing: re-extract the new docx you just wrote and confirm
    (a) the total paragraph count in `word/document.xml` is unchanged from before your edit,
    (b) today's target item's title run now contains `EE0000`, and (c) no other paragraph's
    text or color changed. If anything looks wrong, stop and leave the original docx untouched
    (don't commit a broken edit) - report the problem instead.

11. Before editing the docx (step 8 onward), check whether a Word lock file (a file named
    `~$...docx`) exists next to it - if so, Word likely has it open. In that case, still do
    steps 1-7 (build and compile the project), but SKIP steps 8-10 (don't touch the docx), and
    clearly note in prompt.md that marking the item complete in the docx is pending until Word
    is closed.

12. Commit all new/changed files (the new project folder, and the updated docx if you edited
    it) with a concise commit message naming the item number and project name, and push to
    `main` on origin. Do not amend or force-push. If the push is rejected because origin has
    moved on, `git pull --rebase` once and retry; if it still fails, stop and report rather than
    force-pushing.

At the end, print a short final line in exactly this format so a wrapper script can parse it:
DONE_FOLDER: <the folder name you created, e.g. 068-secure-file-transfer-tool-sftp>
(or `DONE_FOLDER: NONE` if the checklist was already fully complete, or if you stopped early
due to an error).
'@

$prompt = $prompt.Replace('$JavaFxLib', $JavaFxLib)

Write-Host "Invoking Claude Code to generate today's JavaFX project..." -ForegroundColor Yellow

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
    $folder = Join-Path $javaGuiDir $folderName
    Write-Host ""
    Write-Host "=== $folderName ===" -ForegroundColor Green

    $promptMd = Join-Path $folder "prompt.md"
    if (Test-Path $promptMd) {
        Write-Host "--- prompt.md ---" -ForegroundColor DarkGray
        Get-Content $promptMd | Write-Host
    }

    $outDir = Join-Path $folder "out"
    if (Test-Path $outDir) {
        $classCount = (Get-ChildItem $outDir -Filter "*.class" -Recurse | Measure-Object).Count
        Write-Host ""
        Write-Host "Compiled successfully: $classCount class file(s) in out/" -ForegroundColor Green
    }
    else {
        Write-Host "No out/ directory found - compilation may not have completed." -ForegroundColor Red
    }
}

Stop-Transcript
