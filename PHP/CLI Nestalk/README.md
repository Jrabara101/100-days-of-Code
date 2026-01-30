# CLI NestTalk – Recursive Comment System

A simple PHP Command Line tool that demonstrates recursive comment threads (infinite nesting), deleting branches, and path-finding (ancestors).

Features
- View threaded discussions with indentation and pipe symbols for visual threading
- Post top-level comments and replies to any comment ID
- Delete a comment branch (deletes the parent and all descendants)
- Find the "great-grandparent" (3 levels up) for a given comment ID

How to run
1. Ensure PHP is installed (PHP 7.2+ recommended).
2. Open a terminal in this folder and run:

   php nestalk.php

Storage
- Comments are stored as a flat array in `comments.json` (Level 2: JSON storage). You can extend to SQLite (Level 3) if desired.

Key functions
- `showComments($comments, $parentId=null, $prefixParts=[])` – recursive renderer
- `deleteBranch(&$comments, $id)` – deletes the branch under `id`
- `findAncestor($comments, $id, $levelsUp=3)` – path-finding helper

Implementation notes
- The script reads/writes `comments.json` and keeps a simple incremental `id` strategy.
- The display uses ASCII lines and connectors so threads are easy to read in terminal.

Enjoy and extend! 💡